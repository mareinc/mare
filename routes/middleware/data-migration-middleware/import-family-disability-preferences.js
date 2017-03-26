const keystone					= require( 'keystone' );
const Family 					= keystone.list( 'Family' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all family disability preferences.  This is created here to be available to multiple functions below
let familyDisabilityPreferences;
// create an object to hold the disability preferences
let newFamilyDisabilityPreferencesMap = {};
// create references to the map we stored on locals.  This is bound here to be available to multiple functions below since res can't be passed to the generator
let disabilitiesMap;
// expose done to be available to all functions below
let familyDisabilityPreferencesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendFamilyDisabilityPreferences = ( req, res, done ) => {
	// expose the map we'll need for this import
	disabilitiesMap = res.locals.migration.maps.disabilities;
	// expose done to our generator
	familyDisabilityPreferencesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the family disability preferences CSV file to JSON
	const familyDisabilityPreferencesLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the family disability preferences
		CSVConversionMiddleware.fetchFamilyDisabilityPreferences( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of family disability preferences
	familyDisabilityPreferencesLoaded.then( familyDisabilityPreferencesArray => {
		// store the family disability preferences in a variable accessible throughout this file
		familyDisabilityPreferences = familyDisabilityPreferencesArray;
		// call the function to build the sibling map
		exports.buildFamilyDisabilityPreferencesMap();
		// kick off the first run of our generator
		familyDisabilityPreferenceGenerator.next();
	// if there was an error converting the family disability preferences file
	}).catch( reason => {
		console.error( `error processing family disability preferences` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildFamilyDisabilityPreferencesMap = () => {
	// load all family disability preferences
	for( let familyDisabilityPreference of familyDisabilityPreferences ) {
		// for each family disability preference, get the family id
		const familyId = familyDisabilityPreference.fam_id;
	 	// and use the id as a key, and add each disability's _id in a key object
		if( familyId ) {

			if( newFamilyDisabilityPreferencesMap[ familyId ] ) {

					newFamilyDisabilityPreferencesMap[ familyId ].add( familyDisabilityPreference.spn_id );

			} else {

				let newDisabilitySet = new Set( [ familyDisabilityPreference.spn_id ] );
				// create an entry containing a set with the one disability
				newFamilyDisabilityPreferencesMap[ familyId ] = newDisabilitySet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateFamilyDisabilityPreferences = function* generateFamilyDisabilityPreferences() {

	console.log( `creating family disability preferences in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords						= Object.keys( newFamilyDisabilityPreferencesMap ).length,
		remainingRecords 					= totalRecords,
		batchCount							= 200, // number of records to be process simultaneously
		familyDisabilityPreferenceNumber	= 0; // keeps track of the current family disability preference number being processed.  Used for batch processing
	// loop through each family disability preference object we need to create a record for
	for( let key in newFamilyDisabilityPreferencesMap ) {
		// increment the familyDisabilityPreferenceNumber
		familyDisabilityPreferenceNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( familyDisabilityPreferenceNumber % batchCount === 0 ) {
			yield exports.updateFamilyRecord( newFamilyDisabilityPreferencesMap[ key ], key, true );
		} else {
			exports.updateFamilyRecord( newFamilyDisabilityPreferencesMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `family disability preference groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			const resultsMessage = `finished appending ${ totalRecords } family disability preference groups in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Family Disability Preferences',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return familyDisabilityPreferencesImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateFamilyRecord = ( ids, familyId, pauseUntilSaved ) => {

	const disabilityIds = Array.from( ids );

	// create a promise
	const familyLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the family
		utilityModelFetch.getFamilyByRegistrationNumber( resolve, reject, familyId );
	});

	familyLoaded.then( family => {

		let disabilitiesArray = [];

		for( let disabilityId of disabilityIds ) {

			const newDisability = disabilitiesMap[ disabilityId ];

			if( newDisability && disabilitiesArray.indexOf( newDisability ) === -1 ) {
				disabilitiesArray.push( newDisability );
			}
		}

		family.matchingPreferences.disabilities = disabilitiesArray;

		// save the updated family record
		family.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// halt execution by throwing an error
				console.log( `error: ${ err }` );
				throw `[registration number: ${ family.get( 'registrationNumber' ) }] an error occured while appending a disability preference group to the family record.`;
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					familyDisabilityPreferenceGenerator.next();
				}, 1000 );
			}
		});
	});
};

// instantiates the generator used to create family records at a regulated rate
const familyDisabilityPreferenceGenerator = exports.generateFamilyDisabilityPreferences();