const keystone					= require( 'keystone' );
const MediaFeature 				= keystone.list( 'Media Feature' );
// utility middleware
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all media features.  This is created here to be available to multiple functions below
let mediaFeatures;
// expose done to be available to all functions below
let mediaFeatureImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importMediaFeatures = ( req, res, done ) => {
	// expose done to our generator
	mediaFeatureImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the media features CSV file to JSON
	const mediaFeaturesLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the media features
		CSVConversionMiddleware.fetchMediaFeatures( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of media features
	mediaFeaturesLoaded.then( mediaFeaturesArray => {
		// store the media features in a variable accessible throughout this file
		mediaFeatures = mediaFeaturesArray;
		// kick off the first run of our generator
		mediaFeatureGenerator.next();
	// if there was an error converting the media features file
	}).catch( reason => {
		console.error( `error processing media features` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateMediaFeatures = function* generateMediaFeatures() {

	console.log( `creating media features in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords		= mediaFeatures.length,
		remainingRecords 	= totalRecords,
		batchCount			= 300, // number of records to be process simultaneously
		mediaFeatureNumber	= 0; // keeps track of the current media feature number being processed.  Used for batch processing
	// loop through each media feature object we need to create a record for
	for( let mediaFeature of mediaFeatures ) {
		// increment the mediaFeatureNumber
		mediaFeatureNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( mediaFeatureNumber % batchCount === 0 ) {
			yield exports.createMediaFeatureRecord( mediaFeature, true );
		} else {
			exports.createMediaFeatureRecord( mediaFeature, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `media features remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly: ${ importErrors }` );

			const resultsMessage = `finished creating ${ totalRecords } media features in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Media Features',
				results: resultsMessage
			});
			
			console.log( resultsMessage );
			// return control to the data migration view
			return mediaFeatureImportComplete();
		}
	}
};

/* the import function for agencies */
module.exports.createMediaFeatureRecord = ( mediaFeature, pauseUntilSaved ) => {

	// create a promise
	const sourceLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the first child
		utilityModelFetch.getSourceById( resolve, reject, mediaFeature.rcs_id );
	});

	sourceLoaded.then( source => {

		let mediaFeatureNotes = mediaFeature.case_number ? `case number: ${ mediaFeature.case_number }` : '';
			mediaFeatureNotes += mediaFeature.location ? `\n\nlocation: ${ mediaFeature.location }` : '';

		let newMediaFeature = new MediaFeature.model({

			source: source.get( '_id' ),
			date: mediaFeature.schedule_date,
			notes: mediaFeatureNotes,

			oldId: mediaFeature.mft_id

		});

		newMediaFeature.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// store a reference to the entry that caused the error
				importErrors.push( { id: mediaFeature.mft_id, error: err } );
			}
			
			// fire off the next iteration of our generator after pausing for a second
			if( pauseUntilSaved ) {
				setTimeout( () => {
					mediaFeatureGenerator.next();
				}, 1000 );
			}
		});
	});
};

// instantiates the generator used to create agency records at a regulated rate
const mediaFeatureGenerator = exports.generateMediaFeatures();