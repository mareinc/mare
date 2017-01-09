const csv				= require( 'csvtojson' );
// migration file locations
const agenciesFilePath				= './migration-data/csv-data/agency.csv';
const outsideContactsFilePath 	= './migration-data/csv-data/outside_contact.csv';
const inquiriesFilePath				= './migration-data/csv-data/ext_inquiry.csv';

exports.fetchAgencies = ( resolve, reject ) => {
	
	console.log( `fetching agencies from CSV` );

	// fetch all records from the agency csv file
	csv().fromFile( agenciesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', agencyArray => {
			console.log( `agencies fetched` );
			// resolve the promise with the array of agency objects
			resolve( agencyArray );
		})
		.on( 'error', err => {
			console.error( `error fetching agencies or converting to JSON => ${ err }` );
			reject();
		});
}

exports.fetchOutsideContacts = ( resolve, reject ) => {
	
	console.log( `fetching outside contacts from CSV` );

	// fetch all records from the extranet inquiry csv file
	csv().fromFile( outsideContactsFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', outsideContactsArray => {
			console.log( `outside contact groups fetched` );
			// resolve the promise with the array of outside contact objects
			resolve( outsideContactsArray );
		})
		.on( 'error', err => {
			console.error( `error fetching outside contacts or converting to JSON => ${ err }` );
			reject();
		});
}

exports.fetchInquiries = ( resolve, reject ) => {
	
	console.log( `fetching inquiries from CSV` );

	// fetch all records from the extranet inquiry csv file
	csv().fromFile( inquiriesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', inquiriesArray => {
			console.log( `inquiries fetched` );
			// resolve the promise with the array of inquiry objects
			resolve( inquiriesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching inquiries or converting to JSON => ${ err }` );
			reject();
		});
}