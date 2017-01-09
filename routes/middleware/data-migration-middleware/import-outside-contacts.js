/* PREREQUISITE: mailing lists: outside contacts are automatically added to mailing lists post-save */

const keystone				= require( 'keystone' );
const async					= require( 'async' );
const OutsideContact		= keystone.list( 'Outside Contact' );
// utility middleware
const utilityFunctions		= require( './utilities_functions' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all outside contacts.  This is created here to be available to multiple functions below
let outsideContacts;
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let outsideContactGroupsMap,
	statesMap;
// expose done to be available to all functions below
let outsideContactsImportComplete;

module.exports.importOutsideContacts = ( req, res, done ) => {
	// expose the maps we'll need for this import
	outsideContactGroupsMap	= res.locals.outsideContactGroupsMap;
	statesMap				= res.locals.statesMap;
	// expose done to our generator
	outsideContactsImportComplete = done;

	// create a promise for converting the outside contacts CSV file to JSON
	const outsideContactsLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the outside contacts
		CSVConversionMiddleware.fetchOutsideContacts( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of outside contacts
	outsideContactsLoaded.then( outsideContactsArray => {
		// store the outside contacts in a variable accessible throughout this file
		outsideContacts = outsideContactsArray;
		// kick off the first run of our generator
		outsideContactsGenerator.next();
	// if there was an error converting the outside contacts file
	}).catch( reason => {
		console.error( `error processing outside contacts` );
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
		batchCount				= 500, // number of records to be process simultaneously
		outsideContactNumber	= 0; // keeps track of the current outside contact group number being processed.  Used for batch processing
	// loop through each outside contact group object we need to create a record for
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
		console.log(remainingRecords);
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {
			console.log( `finished creating ${ totalRecords } outside contacts in the new system` );
			// return control to the data migration view
			return outsideContactsImportComplete();
		}
	}
}

module.exports.createOutsideContactRecord = ( outsideContact, pauseUntilSaved ) => {

	// let _splitName = exports.splitName( outsideContact.name );
	let _isVolunteer = false;

	if ( outsideContact.contact_type ) {
		_isVolunteer = true;
	}

	// populate instance for Outside Contact object
	let newOutsideContact = new OutsideContact.model({

		type: outsideContactGroupsMap[ outsideContact.contact_type ],
		// type: { type: Types.Relationship, label: 'type of contact', ref: 'Mailing List', many: true, required: true, initial: true },

		// from the outside_contact table get the ocn_id and go to mailing_list_subscription table, where based on the ocn_id, get the mlt_id and then
		// go to mailing_list table and get the name associated with the mlt_id, once you have the name, go to the new system and fetch the new hash id
// WRONG: can't handle a single name
		// name: {
		// 	first: _splitName.first,
		// 	last: _splitName.last
		// },
		name: {
			first: outsideContact.name,
			last: 'Last'
		},

		organization: outsideContact.organization, // WRONG: missing some id's (#2 for example)

		email: outsideContact.email,

		phone: {
			work: outsideContact.phone,
			preferred: 'work'
		},

		address: {
			street1: outsideContact.address_1,
			street2: outsideContact.address_2,
			city: outsideContact.city,
			state: statesMap[ outsideContact.state ],
			zipCode: utilityFunctions.padZipCode( outsideContact.zip ) // WRONG SOMETIMES: 6 DIGITS???
		},

		isVolunteer: _isVolunteer, // WRONG
		oldId: outsideContact.ocn_id

	});

	newOutsideContact.save( ( err, savedModel ) => {
		// if we run into an error
		if( err ) {
			// halt execution by throwing an error
			throw `[ocn_id: ${ outsideContact.ocn_id }] an error occured while saving outside contact`;
		}
		
		// fire off the next iteration of our generator after pausing for a second
		if( pauseUntilSaved ) {
			setTimeout( () => {
				outsideContactsGenerator.next();
			}, 2000 );
		}
	});
};

// instantiates the generator used to create outside contact records at a regulated rate
const outsideContactsGenerator = exports.generateOutsideContacts();

// exports.fetchMailingLists = function fetchMailingLists(ocn_id) {
// 	var mailingListArray = [];

// 	converter.fromFile("./migration-data/csv-data/mailing_list.csv",function(err,array){

// 		if (err) {

//             throw 'Migration Error - Outside Contacts' + err;

//         } else {

// 			for (var i = 1, _count = array.length - 1; i <= _count; i++) {

// 				let mailingListItem = array[i];

// 				if (mailingListItem[4] === ocn_id) {

// 					mailingListArray.push(mailingListMap[mailingListItem[0]]);
// 				}
// 			}
// 		}
// 	});
// }

// exports.splitName = function splitName(name) {
//     var _first = '';
//     var _last = '';

// 	if (name) {

// 		if (name.indexOf(',') > 0){
// 			_last = name.substr(0, name.indexOf(','));
// 			_first = name.substr(name.indexOf(',') + 1);
// 		}
// 		else
// 		{
// 			_first = name.substr(0, name.indexOf(' '));
// 			_last = name.substr(name.indexOf(' ') + 1);
// 		}

// 	}
    

//     return {
//         first: _first,
//         last: _last
//     }
// }
