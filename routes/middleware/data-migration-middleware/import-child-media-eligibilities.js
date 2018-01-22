const keystone				= require( 'keystone' );
const Child 				= keystone.list( 'Child' );
// utility middleware
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all media eligibilities.  This is created here to be available to multiple functions below
let mediaEligibilities;
// create an object to hold the sibling groups
let newMediaEligibilityMap = {};
// create references to the map we stored on locals.  This is bound here to be available to multiple functions below since res can't be passed to the generator
let mediaEligibilitiesMap;
// expose done to be available to all functions below
let mediaEligibilitiesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendMediaEligibilities = ( req, res, done ) => {
	// expose the map we'll need for this import
	mediaEligibilitiesMap = res.locals.migration.maps.mediaEligibilities;
	// expose done to our generator
	mediaEligibilitiesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the media eligibilities CSV file to JSON
	const mediaEligibilitiesLoaded = CSVConversionMiddleware.fetchMediaEligibilities();

	// if the file was successfully converted, it will return the array of media eligibilities
	mediaEligibilitiesLoaded.then( mediaEligibilitiesArray => {
		// store the media eligibilities in a variable accessible throughout this file
		mediaEligibilities = mediaEligibilitiesArray;
		// call the function to build the sibling map
		exports.buildMediaEligibilityMap();
		// kick off the first run of our generator
		mediaEligibilityGenerator.next();
	// if there was an error converting the media eligibilities file
	}).catch( reason => {
		console.error( `error processing media eligibilities` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildMediaEligibilityMap = () => {
	// load all media eligibilities
	for( let mediaEligibility of mediaEligibilities ) {
		// for each media eligibility, get the child id
		const childId = mediaEligibility.chd_id;
	 	// and use the id as a key, and add each child’s _id in a key object
		if( childId ) {

			if( newMediaEligibilityMap[ childId ] ) {

					newMediaEligibilityMap[ childId ].add( mediaEligibility.rcs_id );

			} else {

				let newMediaEligibilitySet = new Set( [ mediaEligibility.rcs_id ] );
				// create an entry containing a set with the one media eligibility
				newMediaEligibilityMap[ childId ] = newMediaEligibilitySet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateMediaEligibility = function* generateMediaEligibility() {

	console.log( `appending media eligibilities to children in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords			= Object.keys( newMediaEligibilityMap ).length,
		remainingRecords 		= totalRecords,
		batchCount				= 100, // number of records to be process simultaneously
		mediaEligibilityNumber	= 0; // keeps track of the current media eligibility number being processed.  Used for batch processing
	// loop through each media eligibility object we need to append to each record
	for( let key in newMediaEligibilityMap ) {
		// increment the mediaEligibilityNumber
		mediaEligibilityNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( mediaEligibilityNumber % batchCount === 0 ) {
			yield exports.updateChildRecord( newMediaEligibilityMap[ key ], key, true );
		} else {
			exports.updateChildRecord( newMediaEligibilityMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `child media eligibilities remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished appending ${ totalRecords } media eligibilities to children in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Children - Media Eligibilities',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return mediaEligibilitiesImportComplete();
		}
	}
};

// a function paired with the generator to append data to a record and request the generator to process the next once finished
module.exports.updateChildRecord = ( ids, childOldId, pauseUntilSaved ) => {

	const mediaEligibilityIds = Array.from( ids );

	// fetch the child
	const childLoaded = utilityModelFetch.getChildByRegistrationNumber( childOldId );
	
	// when the promise resolves
	childLoaded
		.then( child => {

			let mediaEligibilitiesArray = [];

			for( let mediaEligibilityId of mediaEligibilityIds ) {

				const newMediaEligibility = mediaEligibilitiesMap[ mediaEligibilityId ];

				if( newMediaEligibility && mediaEligibilitiesArray.indexOf( newMediaEligibility ) === -1 ) {
					mediaEligibilitiesArray.push( newMediaEligibility );
				}
			}

			child.mediaEligibility = mediaEligibilitiesArray;

			// save the child record
			child.save( ( err, savedModel ) => {
				// if we run into an error
				if( err ) {
					// store a reference to the entry that caused the error
					importErrors.push( { id: mediaEligibility.mlg_id, error: err } );
				}

				// fire off the next iteration of our generator after saving
				if( pauseUntilSaved ) {
					setTimeout( () => {
						mediaEligibilityGenerator.next();
					}, 2000 );
				}
			});
		})
		.catch( err => {
			// log the error
			importErrors.push( { id: mediaEligibility.mlg_id, error: `error adding media eligibilities with ids ${ ids } to child with id ${ childOldId } - ${ err }` } );

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					mediaEligibilityGenerator.next();
				}, 2000 );
			}
		});
};

// instantiates the generator used to create child records at a regulated rate
const mediaEligibilityGenerator = exports.generateMediaEligibility();