const keystone					= require( 'keystone' );
const Family 					= keystone.list( 'Family' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all family race preferences.  This is created here to be available to multiple functions below
let familyRacePreferences;
// create an object to hold the races
let newFamilyRacePreferencesMap = {};
// create references to the map we stored on locals.  This is bound here to be available to multiple functions below since res can't be passed to the generator
let racesMap;
// expose done to be available to all functions below
let familyRacePreferencesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendFamilyRacePreferences = ( req, res, done ) => {
	// expose the map we'll need for this import
	racesMap = res.locals.migration.maps.races;
	// expose done to our generator
	familyRacePreferencesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the family race preferences CSV file to JSON
	const familyRacePreferencesLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the family race preferences
		CSVConversionMiddleware.fetchFamilyRacePreferences( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of family race preferences
	familyRacePreferencesLoaded.then( familyRacePreferencesArray => {
		// store the family race preferences in a variable accessible throughout this file
		familyRacePreferences = familyRacePreferencesArray;
		// call the function to build the sibling map
		exports.buildRaceMap();
		// kick off the first run of our generator
		familyRacePreferenceGenerator.next();
	// if there was an error converting the family race preferences file
	}).catch( reason => {
		console.error( `error processing family race preferences` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildRaceMap = () => {
	// load all family race preferences
	for( let familyRacePreference of familyRacePreferences ) {
		// for each family race preference, get the family id
		const familyId = familyRacePreference.fam_id;
	 	// and use the id as a key, and add each race's _id in a key object
		if( familyId ) {

			if( newFamilyRacePreferencesMap[ familyId ] ) {

					newFamilyRacePreferencesMap[ familyId ].add( familyRacePreference.rce_id );

			} else {

				let newRaceSet = new Set( [ familyRacePreference.rce_id ] );
				// create an entry containing a set with the one race
				newFamilyRacePreferencesMap[ familyId ] = newRaceSet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateFamilyRacePreferences = function* generateFamilyRacePreferences() {

	console.log( `creating family race preferences in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords				= Object.keys( newFamilyRacePreferencesMap ).length,
		remainingRecords 			= totalRecords,
		batchCount					= 200, // number of records to be process simultaneously
		familyRacePreferenceNumber	= 0; // keeps track of the current family race preference number being processed.  Used for batch processing
	// loop through each family race preference object we need to create a record for
	for( let key in newFamilyRacePreferencesMap ) {
		// increment the familyRacePreferenceNumber
		familyRacePreferenceNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( familyRacePreferenceNumber % batchCount === 0 ) {
			yield exports.updateFamilyRecord( newFamilyRacePreferencesMap[ key ], key, true );
		} else {
			exports.updateFamilyRecord( newFamilyRacePreferencesMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `family race preference groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly: ${ importErrors }` );

			const resultsMessage = `finished appending ${ totalRecords } family race preference groups in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Family Race Preferences',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return familyRacePreferencesImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateFamilyRecord = ( ids, familyId, pauseUntilSaved ) => {

	const raceIds = Array.from( ids );

	// create a promise
	const familyLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the family
		utilityModelFetch.getFamilyByRegistrationNumber( resolve, reject, familyId );
	});

	familyLoaded.then( family => {

		let racesArray = [];

		for( let raceId of raceIds ) {

			const newRace = racesMap[ raceId ];

			if( newRace && racesArray.indexOf( newRace ) === -1 ) {
				racesArray.push( newRace );
			}
		}

		family.matchingPreferences.race = racesArray;

		// save the updated family record
		family.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// store a reference to the entry that caused the error
				importErrors.push( { id: family.get( 'registrationNumber' ), error: err } );
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					familyRacePreferenceGenerator.next();
				}, 1000 );
			}
		});
	});
};

// instantiates the generator used to create family records at a regulated rate
const familyRacePreferenceGenerator = exports.generateFamilyRacePreferences();