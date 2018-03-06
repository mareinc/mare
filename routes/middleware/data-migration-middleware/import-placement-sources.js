const keystone					= require( 'keystone' ),
	  _							= require( 'underscore' ),
	  Inquiry 					= keystone.list( 'Inquiry' ),
	  utilityFunctions			= require( './utilities_functions' ),
	  utilityModelFetch			= require( './utilities_model-fetch' ),
	  CSVConversionMiddleware	= require( './utilities_csv-conversion' );

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
	// convert source to an array
	const sourcesArray = [ ...sources ];
	// store the id of the primary source
	const primarySource = sourcesArray[ sourcesArray.length - 1 ];
	// store the ids of all additional ( if any ) sources in an array
	const additionalSources = sourcesArray.slice( 0, sourcesArray.length - 1 );

	// variables to store information returned in the promise chain
	let fetchedChild,
		targets = [];
	
	// fetch the child for the placement
	const childLoaded = utilityModelFetch.getChildByRegistrationNumber( childId );
	// fetch the primary source
	const primarySourceLoaded = utilityModelFetch.getSourceById( primarySource );
	// fetch additional sources
	const additionalSourcesLoaded = utilityModelFetch.getSourcesByIds( additionalSources );
	// kick off a promise chain
	Promise.resolve()
		// fetch the child and store it for later use
		.then( () => childLoaded )
		.then( child => fetchedChild = child )
		.catch( err => console.error( `error fetching child by registration number ${ childId } - ${ err }` ) )
		// fetch the disruptions, legalizations, matches, and placements, and store them for later use
		.then( () => {

			let childId = fetchedChild ? fetchedChild.get( '_id' ) : undefined;

			return Promise.all( [
				utilityModelFetch.getDisruptionsByChildId( childId ),
				utilityModelFetch.getLegalizationsByChildId( childId ),
				utilityModelFetch.getMatchesByChildId( childId ),
				utilityModelFetch.getPlacementsByChildId( childId )
			])
		})
		.then( values => {
			// store the retrieved information in local variables
			const [ disruptions, legalizations, matches, placements ] = values;
			// if values were returned, store the most recent one to apply the source to
			if( !_.isEmpty( disruptions ) ) {
				targets.push( _.max( disruptions, disruption => disruption.disruptionDate ) );
			}

			if( !_.isEmpty( legalizations ) ) {
				targets.push( _.max( legalizations, legalization => legalization.legalizationDate ) );
			}

			if( !_.isEmpty( matches ) ) {
				targets.push( _.max( matches, match => match.matchDate ) );
			}

			if( !_.isEmpty( placements ) ) {
				targets.push( _.max( placements, placement => placement.placementDate ) );
			}
		})
		.catch( err => `error fetching disruptions, legalizations, matches, or placements by child id - ${ err }` )
		// fetch the sources
		.then( () => Promise.all( [ primarySourceLoaded, additionalSourcesLoaded ] ) )
		.then( values => {

			const [ primarySource, additionalSources ] = values;

			const additionalSourcesIds = additionalSources ? additionalSources.map( source => source.get( 'id' ) ) : undefined;

			let placementPromises = [];
			
			for( let target of targets ) {

				const placementPromise = new Promise( ( resolve, reject ) => {

					target.set( 'source', primarySource.get( 'id' ) );
					target.set( 'additionalSources', additionalSourcesIds );

					// save the updated target record
					target.save( ( err, savedModel ) => {
						// if we run into an error
						if( err ) {
							// store a reference to the entry that caused the error
							importErrors.push( { id: childId, error: err } );
						}

						resolve();
					});
				});

				placementPromises.push( placementPromise );
			}

			Promise.all( placementPromises )
				.catch( err => console.error( `placeholder error that should never be hit - ${ err }` ) )
				.then( () => {
					// fire off the next iteration of our generator after pausing
					if( pauseUntilSaved ) {
						setTimeout( () => {
							placementSourceGenerator.next();
						}, 1000 );
					}
				});
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