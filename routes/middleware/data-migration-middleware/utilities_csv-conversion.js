const csv						= require( 'csvtojson' );
// migration file locations
const sourcesFilePath			= './migration-data/csv-data/recruitment_source.csv';
const agenciesFilePath			= './migration-data/csv-data/agency.csv';
const outsideContactsFilePath 	= './migration-data/csv-data/outside_contact.csv';
const inquiriesFilePath			= './migration-data/csv-data/ext_inquiry.csv';
const socialWorkersFilePath		= './migration-data/csv-data/agency_contact.csv';
const childrenFilePath			= './migration-data/csv-data/child.csv';
const childDisabilitiesFilePath	= './migration-data/csv-data/child_special_need.csv';

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
};

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
};

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
};

exports.fetchSocialWorkers = ( resolve, reject ) => {
	
	console.log( `fetching social workers from CSV` );

	// fetch all records from the extranet social worker csv file
	csv().fromFile( socialWorkersFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', socialWorkersArray => {
			console.log( `social workers fetched` );
			// resolve the promise with the array of social worker objects
			resolve( socialWorkersArray );
		})
		.on( 'error', err => {
			console.error( `error fetching social workers or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchChildren = ( resolve, reject ) => {
	
	console.log( `fetching children from CSV` );

	// fetch all records from the children csv file
	csv().fromFile( childrenFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', childrenArray => {
			console.log( `children fetched` );
			// resolve the promise with the array of child objects
			resolve( childrenArray );
		})
		.on( 'error', err => {
			console.error( `error fetching children or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchChildDisabilities = ( resolve, reject ) => {
	
	console.log( `fetching child disabilities from CSV` );

	// fetch all records from the child disabilities csv file
	csv().fromFile( childDisabilitiesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', disabilitiesArray => {
			console.log( `child disabilities fetched` );
			// resolve the promise with the array of disability objects
			resolve( disabilitiesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching child disabilities or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchSources = ( resolve, reject ) => {
	
	console.log( `fetching sources from CSV` );

	// fetch all records from the sources csv file
	csv().fromFile( sourcesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', sourcesArray => {
			console.log( `sources fetched` );
			// resolve the promise with the array of source objects
			resolve( sourcesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching sources or converting to JSON => ${ err }` );
			reject();
		});
};