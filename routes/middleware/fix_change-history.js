const keystone		= require( 'keystone' ),
	  middleware	= require( './middleware' );

// instantiate the generator used to save families at a controlled rate
const familyHistoriesGenerator = fixChangeHistoriesGenerator();

exports.fixFamilyHistories = function( req, res, next ) {
	// kick off the first run of our generator
	familyHistoriesGenerator.next();
};

/* loops through every family record, resaving them */
function* fixChangeHistoriesGenerator() {
	// set the page of family histories to fetch
	let page = 1,
		errors = [];

	while( page ) {
		console.info( `saving family histories ${ ( page - 1 ) * 100 } - ${ page * 100 }` );
		// fetch the page of family histories, waiting to execute further code until we have a result
		const fetchedFamilyHistories = yield fetchFamilyHistoriesByPage( page );
		// if there was an error fetching the page of family histories
		if( fetchedFamilyHistories.responseType === 'error' ) {
			// log the error for debugging purposes
			console.error( `error fetching page ${ page } of family histories - ${ fetchedFamilyHistories.error }` );
		// if the page of family histories was fetched successfully
		} else {
			// loop through each of the returned family history models
			for( let familyHistory of fetchedFamilyHistories.histories ) {
				// save the family history using the saveFamilyHistory generator
				const savedFamilyHistory = yield saveFamilyHistory( familyHistory );
				// if there was an error
				if( savedFamilyHistory.responseType === 'error' ) {
					// push it to the errors array for display after all families have saved
					errors.push( savedFamilyHistory.message );
				}
			}
		}
		// increment the page to fetch for the next run, or set it to false if there are no more pages to fetch
		page = fetchedFamilyHistories.nextPage;
	}
	// loop through each saved error
	for( let error of errors ) {
		// log the error for debugging purposes
		console.error( error );
	}
};

function fetchFamilyHistoriesByPage( page ) {
	// fetch the request page of family records
	keystone.list( 'Family History' )
		.paginate ({
			page: page || 1,
			perPage: 100,
			filters: {} // add any needed filters as { key: value }
		})
		.exec ( ( err, familyHistories ) => {
			// if there was an error
			if( err ) {
				// reject the promise with the error and the next page to fetch ( false if this is the last page )
				familyHistoriesGenerator.next({
					responseType: 'error',
					error: err,
					nextPage: familyHistories.next });
			// if the family histories were fetched successfully
			} else {
				// resolve the promise with the family histories and the next page to fetch ( false if this is the last page )
				familyHistoriesGenerator.next({
					responseType: 'success',
					histories: familyHistories.results,
					nextPage: familyHistories.next });
			}
		});
}

function saveFamilyHistory( familyHistory ) {

	const changes = familyHistory.get( 'changes' );
	
	if( familyHistory.get( 'summary' ) ) {
		// return control to the generator
		familyHistoriesGenerator.next( { responseType: 'success' } );
	
	} else {
		// adjust fields as needed
		familyHistory.set( 'summary', changes );
		familyHistory.set( 'changes', `<p>${ changes }</p>` );
		// attempt the save the family history
		familyHistory.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// return control to the generator with information about the error
				familyHistoriesGenerator.next({
					responseType: 'error',
					message: `${ family.get( 'displayName' ) } - ${ family.get( 'id' ) } - ${ err }` } );
			// if the model saved successfully
			} else {
				// return control to the generator
				familyHistoriesGenerator.next( { responseType: 'success' } );
			}
		});
	}
};