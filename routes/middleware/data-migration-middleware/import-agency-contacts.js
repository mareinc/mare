const keystone					= require( 'keystone' );
const Agency 					= keystone.list( 'Agency' );
const SocialWorker				= keystone.list( 'Social Worker' );
// utility middleware
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all agency contacts.  This is created here to be available to multiple functions below
let agencyContacts;
// create an map to hold the sibling groups
let agencyMap = {};
// expose done to be available to all functions below
let agencyContactImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendAgencyContacts = ( req, res, done ) => {
	// expose done to our generator
	agencyContactImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the agency contacts CSV file to JSON
	const agencyContactsLoaded = CSVConversionMiddleware.fetchAgencyContacts();

	// if the file was successfully converted, it will return the array of agency contacts
	agencyContactsLoaded.then( agencyContactsArray => {
		// store the agency contacts in a variable accessible throughout this file
		agencyContacts = agencyContactsArray;
		// call the function to build the sibling map
		exports.buildAgencyMap();
		// kick off the first run of our generator
		agencyGenerator.next();
	// if there was an error converting the agency contacts file
	}).catch( reason => {
		console.error( `error processing agency contacts` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildAgencyMap = () => {
	// load all agency contacts
	for( let agencyContact of agencyContacts ) {
		// for each contact, get the agency id
		const agencyId = agencyContact.agn_id;
	 	// and use the id as a key, and add each agency id in a key object
		if( agencyId ) {
			// create an entry containing an array with the one agency id
			agencyMap[ agencyId ] = agencyContact.agc_id;
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateAgencyContacts = function* generateAgencyContacts() {

	console.log( `creating agency contacts in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords		= Object.keys( agencyMap ).length,
		remainingRecords 	= totalRecords,
		batchCount			= 100, // number of records to be process simultaneously
		agencyNumber		= 0; // keeps track of the current agency contact number being processed.  Used for batch processing
	// loop through each agency contact object we need to create a record for
	for( let key in agencyMap ) {
		// increment the agencyNumber
		agencyNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( agencyNumber % batchCount === 0 ) {
			yield exports.updateAgencyRecord( key, agencyMap[ key ], true );
		} else {
			exports.updateAgencyRecord( key, agencyMap[ key ], false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `agency contacts remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } agency contacts in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Agency Contacts',
				results: resultsMessage
			});
			
			console.log( resultsMessage );
			// return control to the data migration view
			return agencyContactImportComplete();
		}
	}

	return agencyContactImportComplete();
};

/* the import function for agencies */
module.exports.updateAgencyRecord = ( agencyId, agencyContactId, pauseUntilSaved ) => {
	// create a promise for fetching the agency associated with the contact
	const agencyLoaded = new Promise( ( resolve, reject ) => {
		utilityModelFetch.getAgencyById( resolve, reject, agencyId );
	});	
	// create a promise for fetching the current agency contact record
	const agencyContactLoaded = utilityModelFetch.getSocialWorkerById( agencyContactId );

	// when both resolve
	Promise.all( [ agencyLoaded, agencyContactLoaded ] ).then( values => {
		// store the retrieved agency and agency contact in local variables
		const [ agency, agencyContact ] = values;
		// append the agency contact ID to the agency
		agency.generalInquiryContact = agencyContact.get( '_id' );
		// save the updated agency record
		agency.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// store a reference to the entry that caused the error
				importErrors.push( { id: agencyContactId, error: err.err } );
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					agencyGenerator.next();
				}, 2000 );
			}
		});
	});
};

// instantiates the generator used to create agency records at a regulated rate
const agencyGenerator = exports.generateAgencyContacts();