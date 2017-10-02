const keystone				= require( 'keystone' );
const Child 				= keystone.list( 'Child' );
// utility middleware
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all media feature children.  This is created here to be available to multiple functions below
let mediaFeatureChildren;
// expose done to be available to all functions below
let mediaFeatureChildrenImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendChildren = ( req, res, done ) => {
	// expose done to our generator
	mediaFeatureChildrenImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the media feature children CSV file to JSON
	const mediaFeatureChildrenLoaded = CSVConversionMiddleware.fetchMediaFeatureChildren();

	// if the file was successfully converted, it will return the array of media feature children
	mediaFeatureChildrenLoaded.then( mediaFeatureChildrenArray => {
		// store the media feature children in a variable accessible throughout this file
		mediaFeatureChildren = mediaFeatureChildrenArray;
		// kick off the first run of our generator
		mediaFeatureChildGenerator.next();
	// if there was an error converting the media feature children file
	}).catch( reason => {
		console.error( `error processing media feature children` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateMediaFeatureChildren = function* generateMediaFeatureChildren() {

	console.log( `appending children to media features in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords			= mediaFeatureChildren.length,
		remainingRecords 		= totalRecords,
		batchCount				= 200, // number of records to be process simultaneously
		mediaFeatureChildNumber	= 0; // keeps track of the current media feature child number being processed.  Used for batch processing
	// loop through each media feature child object we need to append to each record
	for( let mediaFeatureChild of mediaFeatureChildren ) {
		// increment the mediaFeatureChildNumber
		mediaFeatureChildNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( mediaFeatureChildNumber % batchCount === 0 ) {
			yield exports.updateMediaFeatureRecord( mediaFeatureChild, true );
		} else {
			exports.updateMediaFeatureRecord( mediaFeatureChild, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `media feature children remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished appending ${ totalRecords } children to media features in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Media Features - Children',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return mediaFeatureChildrenImportComplete();
		}
	}
};

// a function paired with the generator to append data to a record and request the generator to process the next once finished
module.exports.updateMediaFeatureRecord = ( mediaFeatureChild, pauseUntilSaved ) => {
    // fetch the first child
	const childLoaded = utilityModelFetch.getChildByRegistrationNumber( mediaFeatureChild.chd_id );
	// create a promise
	const mediaFeatureLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the _ids from other children
		utilityModelFetch.getMediaFeatureById( resolve, reject, mediaFeatureChild.mft_id );
	});

    Promise.all( [ childLoaded, mediaFeatureLoaded ] ).then( values => {

		const [ child, mediaFeature ] = values;

        mediaFeature.children.push( child.get( '_id' ) );

        // save the child record
        mediaFeature.save( ( err, savedModel ) => {
            // if we run into an error
            if( err ) {
				// store a reference to the entry that caused the error
				importErrors.push( { id: mediaFeature.mfc_id, error: err.err } );
            }

            // fire off the next iteration of our generator after saving
            if( pauseUntilSaved ) {
                mediaFeatureChildGenerator.next();
            }
        });
    });
};

// instantiates the generator used to create child records at a regulated rate
const mediaFeatureChildGenerator = exports.generateMediaFeatureChildren();