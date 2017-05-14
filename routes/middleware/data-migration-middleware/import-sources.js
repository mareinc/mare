const keystone			= require( 'keystone' );
const Source 			= keystone.list( 'Source' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all sources.  This is created here to be available to multiple functions below
let sources;
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let mediaTypesMap;
// expose done to be available to all functions below
let sourceImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importSources = ( req, res, done ) => {
	// expose the maps we'll need for this import
	mediaTypesMap = res.locals.migration.maps.mediaTypes;
	// expose done to our generator
	sourceImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the sources CSV file to JSON
	const sourcesLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the sources
		CSVConversionMiddleware.fetchSources( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of sources
	sourcesLoaded.then( sourcesArray => {
		// store the sources in a variable accessible throughout this file
		sources = sourcesArray;
		// kick off the first run of our generator
		sourceGenerator.next();
	// if there was an error converting the sources file
	}).catch( reason => {
		console.error( `error processing sources` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateSources = function* generateSources() {

	console.log( `creating sources in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords		= sources.length,
		remainingRecords 	= totalRecords,
		batchCount			= 100, // number of records to be process simultaneously
		sourceNumber		= 0; // keeps track of the current source number being processed.  Used for batch processing
	// loop through each source object we need to create a record for
	for( let source of sources ) {
		// increment the sourceNumber
		sourceNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( sourceNumber % batchCount === 0 ) {
			yield exports.createSourceRecord( source, true );
		} else {
			exports.createSourceRecord( source, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } sources in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Sources',
				results: resultsMessage
			});
			
			console.log( resultsMessage );
			// return control to the data migration view
			return sourceImportComplete();
		}
	}
};

/* the import function for agencies */
module.exports.createSourceRecord = ( source, pauseUntilSaved ) => {		

	let newSource = new Source.model({

		source: source.name,
		type: source.is_media_outlet === 'Y' ? 'media' : 'event',
		isActive: source.is_media_outlet_active === 'Y' ? true : false,
		mediaFrequency: source.media_frequency,
		mediaType: source.media_type ? mediaTypesMap[ source.media_type ] : undefined,

		oldId: source.rcs_id

	});

	newSource.save( ( err, savedModel ) => {
		// if we run into an error
		if( err ) {
			// store a reference to the entry that caused the error
			importErrors.push( { id: source.rcs_id, error: err.err } );
		}
		
		// fire off the next iteration of our generator after pausing for a second
		if( pauseUntilSaved ) {
			setTimeout( () => {
				sourceGenerator.next();
			}, 1000 );
		}
	});
};

// instantiates the generator used to create agency records at a regulated rate
const sourceGenerator = exports.generateSources();