const keystone		= require( 'keystone' ),
	  middleware	= require( './middleware' );

// instantiate the generator used to save families at a controlled rate
const familiesGenerator = fixFamiliesGenerator();

exports.fixFamilies = function( req, res, next ) {
	// if the user is trying to run this script against the production database
	if( /^.*\/production.*$/.test( process.env.MONGO_URI ) ) {
		// alert them of what they're doing and how to get around this message
		return res.send(`
		
			WARNING:
		
			You are running this script against the production database.
		
			To allow execution, open fix_family.js and comment out the if block in fixFamilies()` );
	}
	// kick off the first run of our generator
	familiesGenerator.next();
};

/* loops through every family record, resaving them */
function* fixFamiliesGenerator() {
	// set the page of families to fetch
	let page = 1;

	while( page ) {
		console.info( `saving families ${ ( page - 1 ) * 100 } - ${ page * 100 }` );
		// create an array to store all promises for saving families to allow batch processing
		let familyPromises = [];
		// fetch the page of families, waiting to execute further code until we have a result
		const fetchedFamilies = yield fetchFamiliesByPage( page );
		// if there was an error fetching the page of families
		if( fetchedFamilies.responseType === 'error' ) {
			// log the error for debugging purposes
			console.error( `error fetching page ${ page } of children - ${ fetchedFamilies.error }` );
		// if the page of families was fetched successfully
		} else {
			// loop through each of the returned family models
			for( let family of fetchedFamilies.families ) {
				// save the model using the saveModel generator
				const familySaved = saveFamily( family );
				// store the promise in the array of promises to batch them all together
				familyPromises.push( familySaved );
			}
			// pause processing of the next page until the Promise.all has had a chance to finish running
			yield Promise.all( familyPromises )
				// if there was an error saving any families, log it
				.catch( err => console.error( err ) )
				// no matter if there was an error, move on to the next page
				.then( () => {
					// advance the page to fetch until there are no pages left
					page = fetchedFamilies.nextPage;
					// unpause the generator to allow processing of the next page
					familiesGenerator.next();
				});
		}
		// increment the page to fetch for the next run, or set it to false if there are no more pages to fetch
		page = fetchedFamilies.nextPage;
	}
	// let the user know all records have been processed
	console.info( 'all records have been updated' );
};

function fetchFamiliesByPage( page ) {

	return new Promise( ( resolve, reject ) => {
		// fetch the request page of family records
		keystone.list( 'Family' )
			.paginate ({
				page: page || 1,
				perPage: 100,
				filters: {} // add any needed filters as { key: value }
			})
			.exec ( ( err, families ) => {

				// if there was an error
				if( err ) {
					// reject the promise with the error and the next page to fetch ( false if this is the last page )
					familiesGenerator.next({
						responseType: 'error',
						error: err,
						nextPage: families.next });
				// if the families were fetched successfully
				} else {
					// resolve the promise with the families and the next page to fetch ( false if this is the last page )
					familiesGenerator.next({
						responseType: 'success',
						families: families.results,
						nextPage: families.next });
				}
			});
	});
}

function saveFamily( family ) {

	return new Promise( ( resolve, reject ) => {
	
		// family.set( 'isActive', false );
		// attempt the save the family
		family.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// reject the promise with details of the error
				reject( `${ family.get( '_id' ) } - ${ err }` );
			// if the model saved successfully
			} else {
				// return control to the generator
				resolve();
			}
		});
	});
};
