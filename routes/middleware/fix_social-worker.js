const keystone		= require( 'keystone' ),
	  middleware	= require( './middleware' );

// instantiate the generator used to save social workers at a controlled rate
const socialWorkersGenerator = fixSocialWorkersGenerator();

exports.fixSocialWorkers = function( req, res, next ) {
	// if the user is trying to run this script against the production database
	if( /^.*\/production.*$/.test( process.env.MONGO_URI ) ) {
		// alert them of what they're doing and how to get around this message
		return res.send(`
		
			WARNING:
		
			You are running this script against the production database.
		
			To allow execution, open fix_social-worker.js and comment out the if block in fixSocialWorkers()` );
	}
	// kick off the first run of our generator
	socialWorkersGenerator.next();
};

/* loops through every social worker record, resaving them */
function* fixSocialWorkersGenerator() {
	// set the page of social workers to fetch
	let page = 1,
		errors = [];

	while( page ) {
		console.info( `saving social workers ${ ( page - 1 ) * 100 } - ${ page * 100 }` );
		// fetch the page of social workers, waiting to execute further code until we have a result
		const fetchedSocialWorkers = yield fetchSocialWorkersByPage( page );
		// if there was an error fetching the page of social workers
		if( fetchedSocialWorkers.responseType === 'error' ) {
			// log the error for debugging purposes
			console.error( `error fetching page ${ page } of social workers - ${ fetchedSocialWorkers.error }` );
		// if the page of social workers was fetched successfully
		} else {
			// loop through each of the returned social worker models
			for( let socialWorker of fetchedSocialWorkers.socialWorkers ) {
				// save the social worker using the saveSocialWorker generator
				const savedSocialWorker = yield saveSocialWorker( socialWorker );
				// if there was an error
				if( savedSocialWorker.responseType === 'error' ) {
					// push it to the errors array for display after all social workers have saved
					errors.push( savedSocialWorker.message );
				}
			}
		}
		// increment the page to fetch for the next run, or set it to false if there are no more pages to fetch
		page = fetchedSocialWorkers.nextPage;
	}
	// loop through each saved error
	for( let error of errors ) {
		// log the error for debugging purposes
		console.error( error );
	}
};

function fetchSocialWorkersByPage( page ) {

	return new Promise( ( resolve, reject ) => {
		// fetch the request page of social worker records
		keystone.list( 'Social Worker' )
			.paginate ({
				page: page || 1,
				perPage: 100,
				filters: {} // add any needed filters as { key: value }
			})
			.exec ( ( err, socialWorkers ) => {

				// if there was an error
				if( err ) {
					// reject the promise with the error and the next page to fetch ( false if this is the last page )
					socialWorkersGenerator.next({
						responseType: 'error',
						error: err,
						nextPage: socialWorkers.next });
				// if the social workers were fetched successfully
				} else {
					// resolve the promise with the social workers and the next page to fetch ( false if this is the last page )
					socialWorkersGenerator.next({
						responseType: 'success',
						socialWorkers: socialWorkers.results,
						nextPage: socialWorkers.next });
				}
			});
	});
}

function saveSocialWorker( socialWorker ) {

	return new Promise( ( resolve, reject ) => {
		// attempt the save the social worker
		socialWorker.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// return control back to the generator with details about the error
				socialWorkersGenerator.next({
					responseType: 'error',
					message: `${ socialWorker.get( 'name.full' ) } - ${ socialWorker.get( 'id' ) } - ${ err }` } );
			// if the model saved successfully
			} else {
				// return control back to the generator
				socialWorkersGenerator.next( { responseType: 'success' } );
			}
		});
	});
};
