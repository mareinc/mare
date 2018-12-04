const keystone		= require( 'keystone' ),
	  middleware	= require( './middleware' );

// instantiate the generator used to save agencies at a controlled rate
const agenciesGenerator = fixAgenciesGenerator();

exports.fixAgencies = function( req, res, next ) {
	// if the user is trying to run this script against the production database
	if( /^.*\/production.*$/.test( process.env.MONGO_URI ) ) {
		// alert them of what they're doing and how to get around this message
		return res.send(`
		
			WARNING:
		
			You are running this script against the production database.
		
			To allow execution, open fix_agency.js and comment out the if block in fixAgencies()` );
	}
	// kick off the first run of our generator
	agenciesGenerator.next();
};

/* loops through every agency record, resaving them */
function* fixAgenciesGenerator() {
	// set the page of agencies to fetch
	let page = 1,
		errors = [];

	while( page ) {
		console.info( `saving agencies ${ ( page - 1 ) * 100 } - ${ page * 100 }` );
		// fetch the page of agencies, waiting to execute further code until we have a result
		const fetchedAgencies = yield fetchAgenciesByPage( page );
		// if there was an error fetching the page of agencies
		if( fetchedAgencies.responseType === 'error' ) {
			// log the error for debugging purposes
			console.error( `error fetching page ${ page } of agencies - ${ fetchedAgencies.error }` );
		// if the page of agencies was fetched successfully
		} else {
			// loop through each of the returned agency models
			for( let agency of fetchedAgencies.agencies ) {
				// save the agency using the saveAgency generator
				const savedAgency = yield saveAgency( agency );
				// if there was an error
				if( savedAgency.responseType === 'error' ) {
					// push it to the errors array for display after all agencies have saved
					errors.push( savedAgency.message );
				}
			}
		}
		// increment the page to fetch for the next run, or set it to false if there are no more pages to fetch
		page = fetchedAgencies.nextPage;
	}
	// loop through each saved error
	for( let error of errors ) {
		// log the error for debugging purposes
		console.error( error );
	}
};

function fetchAgenciesByPage( page ) {

	return new Promise( ( resolve, reject ) => {
		// fetch the request page of agency records
		keystone.list( 'Agency' )
			.paginate ({
				page: page || 1,
				perPage: 100,
				filters: {} // add any needed filters as { key: value }
			})
			.exec ( ( err, agencies ) => {

				// if there was an error
				if( err ) {
					// reject the promise with the error and the next page to fetch ( false if this is the last page )
					agenciesGenerator.next({
						responseType: 'error',
						error: err,
						nextPage: agencies.next });
				// if the agencies were fetched successfully
				} else {
					// resolve the promise with the agencies and the next page to fetch ( false if this is the last page )
					agenciesGenerator.next({
						responseType: 'success',
						agencies: agencies.results,
						nextPage: agencies.next });
				}
			});
	});
}

function saveAgency( agency ) {

	return new Promise( ( resolve, reject ) => {
		// attempt the save the agency
		agency.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// return control back to the generator with details about the error
				agenciesGenerator.next({
					responseType: 'error',
					message: `${ agency.get( 'name.full' ) } - ${ agency.get( 'id' ) } - ${ err }` } );
			// if the model saved successfully
			} else {
				// return control back to the generator
				agenciesGenerator.next( { responseType: 'success' } );
			}
		});
	});
};
