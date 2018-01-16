const keystone					= require( 'keystone' ),
	  ChildHistory 				= keystone.list( 'Child History' ),
	  // services
	  userService				= require( '../service_user' ),
	  // utility middleware
	  utilityFunctions			= require( './utilities_functions' ),
	  utilityModelFetch			= require( './utilities_model-fetch' ),
	  // csv conversion middleware
	  CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create a map to hold all child histories.  These are created here to be available to multiple functions below
let childHistories = new Map();
// expose done to be available to all functions below
let childHistoriesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importChildHistories = ( req, res, done ) => {
	// expose done to our generator
	childHistoriesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the child histories CSV file to JSON
	const childHistoriesLoaded = CSVConversionMiddleware.fetchChildHistories();
	// if the file was successfully converted, it will return the array of child histories
	childHistoriesLoaded
		.then( childHistoriesArray => {

			for( let childHistory of childHistoriesArray ) {
				if( childHistories.has( childHistory.chd_id ) ) {
					childHistories.get( childHistory.chd_id ).push( childHistory );
				} else {
					childHistories.set( childHistory.chd_id, [ childHistory ] );
				}
			}

			console.timeEnd( 'loading child histories' );

			// kick off the first run of our generator
			childHistoryGenerator.next();
		// if there was an error converting the child histories file
		}).catch( reason => {
			console.error( `error processing child histories - ${ reason }` );
			// aborting the import
			return done();
		});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateChildHistories = function* generateChildHistories() {
	
	console.log( `creating child histories in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords			= childHistories.size,
		remainingRecords 		= totalRecords,
		batchCount				= 20, // number of records to be process simultaneously
		childHistoriesNumber	= 0; // keeps track of the current child history group being processed.  Used for batch processing
	// loop through each child history we need to create a record for, and extract the key / array pair
	for( let [ childId, childHistory ] of childHistories ) {
		// increment the childHistoriesNumber
		childHistoriesNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( childHistoriesNumber % batchCount === 0 ) {
			yield exports.createChildHistoryRecord( childId, childHistory, true );
		} else {
			exports.createChildHistoryRecord( childId, childHistory, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `child history groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } child histories in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Child Histories',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return childHistoriesImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.createChildHistoryRecord = ( childId, childHistoryArray, pauseUntilSaved ) => {

	// fetch the child associated with the current target child as a base comparison
	let fetchCurrentChild = utilityModelFetch.getChildByRegistrationNumber( childId );
	// once the child is fetched
	fetchCurrentChild.then( currentChild => {
		// loop through all the entries of the child history array
		for( let childHistory of childHistoryArray ) {
			// create a promise for fetching the admin who created the history entry, and set it to Migration Bot if none is listed
			const adminLoaded = !childHistory.created_by
								? userService.getUserByFullName( 'Migration Bot', 'Admin' )
								: utilityModelFetch.getAdminById( childHistory.created_by );

			adminLoaded.then( admin => {
				// IMPORTANT TODO: where you left off, the first entry in each set of changes has name and other information,
				//				   need to determine how to save those entries.  First thought is load the child, and check the fields that always appear
				//				   such as name, if it hasn't changed, don't update it.  You'll need to load the child, create a copy of the child
				//				   make changes to the copy, then pass both into the change history function with the date and admin to associate it with.
				// loop through the child history entries and translate all fields to values for the new system
				// if it's the first element in the array, don't pass the old object so it creates the 'record created' message
				// create the child history record with the appended changes
				// update the existing history creation scripts to remove the FROM label and value, and just use the TO label and value
				// create a new child history
				let newChildHistory = new ChildHistory.model({
					// LEFT OFF HERE, NEED TO COMPARE EACH FIELD FOR CHANGES
					child		: child.get( '_id' ),
					date		: new Date( childHistory.created_datetime ),
					changes		: '', // need to extract these based on what's different from the current child
					modifiedBy	: admin
				});

				// save the new child history record
				newChildHistory.save( ( err, savedModel ) => {
					// if we run into an error
					if( err ) {
						// store a reference to the entry that caused the error
						importErrors.push( { id: childHistory.chd_h_id, error: err.err } );
					}

					// fire off the next iteration of our generator after pausing
					if( pauseUntilSaved ) {
						setTimeout( () => {
							childHistoryGenerator.next();
						}, 1000 );
					}
				});
			});
		}
	});
};

// instantiates the generator used to create family records at a regulated rate
const childHistoryGenerator = exports.generateChildHistories();