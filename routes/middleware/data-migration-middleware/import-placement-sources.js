const keystone					= require( 'keystone' );
const Inquiry 					= keystone.list( 'Inquiry' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all placement sources.  This is created here to be available to multiple functions below
let placementSources;
// create an object to hold the placement sources
let newPlacementSourcesMap = {};
// expose done to be available to all functions below
let placementSourcesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendPlacementSources = ( req, res, done ) => {
	// expose done to our generator
	placementSourcesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the placement sources CSV file to JSON
	const placementSourcesLoaded = CSVConversionMiddleware.fetchPlacementSources();

	// if the file was successfully converted, it will return the array of placement sources
	placementSourcesLoaded.then( placementSourcesArray => {
		// store the placement sources in a variable accessible throughout this file
		placementSources = placementSourcesArray;
		// call the function to build the sibling map
		exports.buildPlacementSourcesMap();
		// kick off the first run of our generator
		placementSourceGenerator.next();
	// if there was an error converting the placement sources file
	}).catch( err => {
		console.error( `error processing placement sources - ${ err }` );
		// aborting the import
		return done();
	});
};

module.exports.buildPlacementSourcesMap = () => {
	// load all placement sources
	for( let placementSource of placementSources ) {
		// for each placement source, get the inquiry id
		const childId = placementSource.chd_id;
	 	// and use the id as a key, and add each placement source's _id in a key object
		if( childId ) {

			if( newPlacementSourcesMap[ childId ] ) {

				newPlacementSourcesMap[ childId ].add( placementSource.rcs_id );

			} else {

				let newPlacementSourceSet = new Set( [ placementSource.rcs_id ] );
				// create an entry containing a set with the one placement source
				newPlacementSourcesMap[ childId ] = newPlacementSourceSet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generatePlacementSources = function* generatePlacementSources() {

	console.log( `creating placement sources in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords						= Object.keys( newPlacementSourcesMap ).length,
		remainingRecords 					= totalRecords,
		batchCount							= 100, // number of records to be process simultaneously
		placementSourceNumber				= 0; // keeps track of the current placement source number being processed.  Used for batch processing

	console.log( `placement source groups remaining: ${ remainingRecords }` );

	// loop through each placement source object we need to create a record for
	for( let key in newPlacementSourcesMap ) {
		// increment the placementSourceNumber
		placementSourceNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( placementSourceNumber % batchCount === 0 ) {
			yield exports.updatePlacementRecord( key, newPlacementSourcesMap[ key ], key, true );
		} else {
			exports.updatePlacementRecord( key, newPlacementSourcesMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;

		if( remainingRecords % 100 === 0 ) {
			console.log( `placement source groups remaining: ${ remainingRecords }` );
		}
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished appending ${ totalRecords } placement source groups in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'placement sources',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return placementSourcesImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updatePlacementRecord = ( childId, sources, pauseUntilSaved ) => {

	const sourcesArray = [ ...sources ];

	const primarySource = sourcesArray[ sourcesArray.length - 1 ];

	const additionalSources = sourcesArray.slice( 0, sourcesArray.length - 1 );
	// fetch the placement
	const placementsLoaded = utilityModelFetch.getPlacementsByChildRegistrationNumber( childId );
	// fetch the primary source
	const primarySourceLoaded = utilityModelFetch.getSourceById( primarySource );
	// fetch additional sources
	const additionalSourcesLoaded = utilityModelFetch.getSourcesByIds( additionalSources );

	Promise.all( [ placementLoaded, primarySourceLoaded, additionalSourcesLoaded ] )
		.then( values => {

			const [ placements, primarySource, additionalSources ] = values;

			let placementPromises = [];

			for( let placement of placements ) {

				placement.source = primarySource;
				placement.additionalSources = additionalSources;

				// save the updated placement record
				placement.save( ( err, savedModel ) => {
					// if we run into an error
					if( err ) {
						// store a reference to the entry that caused the error
						importErrors.push( { id: childId, error: err } );
					}
				});
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					placementSourceGenerator.next();
				}, 1000 );
			}
		})
		.catch( err => {
			// we can assume it was a reject from trying to fetch the city or town by an unrecognized name
			importErrors.push( { id: childId, error: `error adding sources with ids ${ sources } to placement - ${ err }` } );

			if( pauseUntilSaved ) {
				setTimeout( () => {
					placementSourceGenerator.next();
				}, 1000 );
			}
		});
};

// instantiates the generator used to create placement source records at a regulated rate
const placementSourceGenerator = exports.generatePlacementSources();