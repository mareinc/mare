const keystone				= require( 'keystone' );
const Child 				= keystone.list( 'Child' );
// utility middleware
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all disabilities.  This is created here to be available to multiple functions below
let childDisabilities;
// create references to the map we stored on locals.  This is bound here to be available to multiple functions below since res can't be passed to the generator
let disabilitiesMap;
// expose done to be available to all functions below
let childDisabilitiesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendDisabilities = ( req, res, done ) => {
	// expose the map we'll need for this import
	disabilitiesMap = res.locals.migration.maps.disabilities;
	// expose done to our generator
	childDisabilitiesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the child disabilities CSV file to JSON
	const childDisabilitiesLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the child disabilities
		CSVConversionMiddleware.fetchChildDisabilities( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of child disabilities
	childDisabilitiesLoaded.then( childDisabilitiesArray => {
		// store the child disabilities in a variable accessible throughout this file
		childDisabilities = childDisabilitiesArray;
		// kick off the first run of our generator
		childDisabilityGenerator.next();
	// if there was an error converting the disabilities file
	}).catch( reason => {
		console.error( `error processing child disabilities` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateChildDisabilities = function* generateChildDisabilities() {

	console.log( `appending child disabilities to children in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords			= childDisabilities.length,
		remainingRecords 		= totalRecords,
		batchCount				= 1, // number of records to be process simultaneously
		childDisabilityNumber	= 0; // keeps track of the current child disability number being processed.  Used for batch processing
	// loop through each child disability object we need to append to each record
	for( let childDisability of childDisabilities ) {
		// increment the childDisabilityNumber
		childDisabilityNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( childDisabilityNumber % batchCount === 0 ) {
			yield exports.updateChildRecord( childDisability, true );
		} else {
			exports.updateChildRecord( childDisability, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `child disabilities remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly: ${ importErrors }` );

			const resultsMessage = `finished appending ${ totalRecords } disabilities to children in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Child Disabilities',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return childDisabilitiesImportComplete();
		}
	}
};

// a function paired with the generator to append data to a record and request the generator to process the next once finished
module.exports.updateChildRecord = ( childDisability, pauseUntilSaved ) => {

	// create a promise
	const childLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the first child
		utilityModelFetch.getChildByRegistrationNumber( resolve, reject, childDisability.chd_id );
	});
	// populate disability field of the child specified in the disability record
	childLoaded.then( child => {
		// find the disability id using the disabilities map
		let newDisability = disabilitiesMap[ childDisability.spn_id ];
		// add the disability to the child's disabilities array
		child.disabilities.push( newDisability );

		// save the child record
		child.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// store a reference to the entry that caused the error
				importErrors.push( { id: childDisability.csn_id, error: err } );
			}

			// fire off the next iteration of our generator after saving
			if( pauseUntilSaved ) {
				childDisabilityGenerator.next();
			}
		});
	});
};

// instantiates the generator used to create child records at a regulated rate
const childDisabilityGenerator = exports.generateChildDisabilities();