const keystone					= require( 'keystone' );
const OutsideContact			= keystone.list( 'Outside Contact' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all outside contacts.  This is created here to be available to multiple functions below
let outsideContacts;
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let contactGroupsMap,
	statesMap;
// expose done to be available to all functions below
let outsideContactsImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importOutsideContacts = ( req, res, done ) => {
	// expose the maps we'll need for this import
	contactGroupsMap	= res.locals.migration.maps.contactGroups;
	statesMap			= res.locals.migration.maps.states;
	// expose done to our generator
	outsideContactsImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the outside contacts CSV file to JSON
	const outsideContactsLoaded = CSVConversionMiddleware.fetchOutsideContacts();
	
	// if the file was successfully converted, it will return the array of outside contacts
	outsideContactsLoaded.then( outsideContactsArray => {
		// store the outside contacts in a variable accessible throughout this file
		outsideContacts = outsideContactsArray;
		// kick off the first run of our generator
		outsideContactsGenerator.next();
	// if there was an error converting the outside contacts file
	}).catch( reason => {
		console.error( `error processing outside contacts` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateOutsideContacts = function* generateOutsideContacts() {

	console.log( `creating outside contacts in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords			= outsideContacts.length,
		remainingRecords 		= totalRecords,
		batchCount				= 100, // number of records to be process simultaneously
		outsideContactNumber	= 0; // keeps track of the current outside contact number being processed.  Used for batch processing
	// loop through each outside contact object we need to create a record for
	for( let outsideContact of outsideContacts ) {
		// increment the outsideContactNumber
		outsideContactNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( outsideContactNumber % batchCount === 0 ) {
			yield exports.createOutsideContactRecord( outsideContact, true );
		} else {
			exports.createOutsideContactRecord( outsideContact, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `outside contacts remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } outside contacts in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Outside Contacts',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return outsideContactsImportComplete();
		}
	}
}

module.exports.createOutsideContactRecord = ( outsideContact, pauseUntilSaved ) => {

	// populate instance for Outside Contact object
	let newOutsideContact = new OutsideContact.model({

		contactGroups: contactGroupsMap[ outsideContact.contact_type ],

		// from the outside_contact table get the ocn_id and go to mailing_list_subscription table, where based on the ocn_id, get the mlt_id and then
		// go to mailing_list table and get the name associated with the mlt_id, once you have the name, go to the new system and fetch the new hash id

		name: outsideContact.name.trim(),
		organization: outsideContact.organization.trim(),
		email: outsideContact.email.trim(),

		phone: {
			work: outsideContact.phone.trim(),
			preferred: 'work'
		},

		address: {
			street1: outsideContact.address_1.trim(),
			street2: outsideContact.address_2.trim(),
			city: outsideContact.city.trim(),
			state: statesMap[ outsideContact.state ],
			zipCode: utilityFunctions.padZipCode( outsideContact.zip )
		},

		oldId: outsideContact.ocn_id

	});

	newOutsideContact.save( ( err, savedModel ) => {
		// if we run into an error
		if( err ) {
			// store a reference to the entry that caused the error
			importErrors.push( { id: outsideContact.ocn_id, error: err } );
		}
		
		// fire off the next iteration of our generator after pausing
		if( pauseUntilSaved ) {
			setTimeout( () => {
				outsideContactsGenerator.next();
			}, 1000 );
		}
	});
};

// instantiates the generator used to create outside contact records at a regulated rate
const outsideContactsGenerator = exports.generateOutsideContacts();