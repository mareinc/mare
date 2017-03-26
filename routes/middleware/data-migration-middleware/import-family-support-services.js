const keystone					= require( 'keystone' );
const Family 					= keystone.list( 'Family' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all family support services.  This is created here to be available to multiple functions below
let familySupportServices;
// create an object to hold the family support services
let newFamilySupportServicesMap = {};
// expose done to be available to all functions below
let familySupportServicesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendFamilySupportServices = ( req, res, done ) => {
	// expose done to our generator
	familySupportServicesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the family support services CSV file to JSON
	const familySupportServicesLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the family support services
		CSVConversionMiddleware.fetchFamilySupportServices( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of family support services
	familySupportServicesLoaded.then( familySupportServicesArray => {
		// store the family support services in a variable accessible throughout this file
		familySupportServices = familySupportServicesArray;
		// call the function to build the sibling map
		exports.buildSupportServiceMap();
		// kick off the first run of our generator
		familySupportServiceGenerator.next();
	// if there was an error converting the family support services file
	}).catch( reason => {
		console.error( `error processing family support services` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildSupportServiceMap = () => {
	// load all family support services
	for( let familySupportService of familySupportServices ) {
		// for each family support service, get the family id
		const familyId = familySupportService.fam_id;
	 	// and use the id as a key, and add each support service's _id in a key object
		if( familyId ) {

			if( newFamilySupportServicesMap[ familyId ] ) {

					newFamilySupportServicesMap[ familyId ].add( familySupportService.ssv_id );

			} else {

				let newSupportServiceSet = new Set( [ familySupportService.ssv_id ] );
				// create an entry containing a set with the one support service
				newFamilySupportServicesMap[ familyId ] = newSupportServiceSet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateFamilySupportServices = function* generateFamilySupportServices() {

	console.log( `creating family support services in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords				= Object.keys( newFamilySupportServicesMap ).length,
		remainingRecords 			= totalRecords,
		batchCount					= 200, // number of records to be process simultaneously
		familySupportServiceNumber	= 0; // keeps track of the current family support service number being processed.  Used for batch processing
	// loop through each family support service object we need to create a record for
	for( let key in newFamilySupportServicesMap ) {
		// increment the familySupportServiceNumber
		familySupportServiceNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( familySupportServiceNumber % batchCount === 0 ) {
			yield exports.updateFamilyRecord( newFamilySupportServicesMap[ key ], key, true );
		} else {
			exports.updateFamilyRecord( newFamilySupportServicesMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `family support service groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			const resultsMessage = `finished appending ${ totalRecords } family support service groups in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Family Support Services',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return familySupportServicesImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateFamilyRecord = ( ids, familyId, pauseUntilSaved ) => {

	const supportServiceIds = Array.from( ids );

	// create a promise
	const familyLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the family
		utilityModelFetch.getFamilyByRegistrationNumber( resolve, reject, familyId );
	});

	familyLoaded.then( family => {

		family.familyServices.mentee						= supportServiceIds.indexOf( 10 ) !== -1;
		family.familyServices.mentor						= supportServiceIds.indexOf( 20 ) !== -1;
		family.familyServices.mediaSpokesperson				= supportServiceIds.indexOf( 30 ) !== -1;
		family.familyServices.eventPresenterOrSpokesperson	= supportServiceIds.indexOf( 40 ) !== -1;
		family.familyServices.communityOutreach				= supportServiceIds.indexOf( 100 ) !== -1;
		family.familyServices.fundraising					= supportServiceIds.indexOf( 110 ) !== -1;
		family.familyServices.MARESupportGroupLeader		= supportServiceIds.indexOf( 80 ) !== -1;
		family.familyServices.MARESupportGroupParticipant	= supportServiceIds.indexOf( 90 ) !== -1;
		family.familyServices.receivesConsultationServices	= supportServiceIds.indexOf( 50 ) !== -1 ||
															  supportServiceIds.indexOf( 60 ) !== -1 ||
															  supportServiceIds.indexOf( 70 ) !== -1;

		// save the updated family record
		family.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// halt execution by throwing an error
				console.log( `error: ${ err }` );
				throw `[registration number: ${ family.get( 'registrationNumber' ) }] an error occured while appending a support service preference group to the family record.`;
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					familySupportServiceGenerator.next();
				}, 1000 );
			}
		});
	});
};

// instantiates the generator used to create family records at a regulated rate
const familySupportServiceGenerator = exports.generateFamilySupportServices();