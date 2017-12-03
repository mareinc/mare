// TODO: add permissions.isVerifiable to the import.  They can only have verified their email address if they have one

const keystone					= require( 'keystone' );
const Family 					= keystone.list( 'Family' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all family contacts.  This is created here to be available to multiple functions below
let familyContacts;
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let gendersMap,
	racesMap;
// create an object to hold the family contacts
let newFamilyContactsMap = {};
// expose done to be available to all functions below
let familyContactsImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendFamilyContacts = ( req, res, done ) => {
	// expose the maps we'll need for this import
	gendersMap	= res.locals.migration.maps.genders;
	racesMap	= res.locals.migration.maps.races;
	// expose done to our generator
	familyContactsImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the family contacts CSV file to JSON
	const familyContactsLoaded = CSVConversionMiddleware.fetchFamilyContacts();

	// if the file was successfully converted, it will return the array of family contacts
	familyContactsLoaded.then( familyContactsArray => {
		// store the family contacts in a variable accessible throughout this file
		familyContacts = familyContactsArray;
		// call the function to build the family contacts map
		exports.buildContactMap();
		// kick off the first run of our generator
		familyContactGenerator.next();
	// if there was an error converting the family contacts file
	}).catch( reason => {
		console.error( `error processing family contacts` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildContactMap = () => {
	// load all family contacts
	for( let familyContact of familyContacts ) {
		// for each family contacts get the family id
		const familyId = familyContact.fam_id;
	 	// and use the id as a key, and add each support service's _id in a key object
		if( familyId ) {
			// TODO: possibly remove this setting as it's a 1-1 lineup and this is just adds extra compute time up front
			let newContact = {
				index							: familyContact.contact_index,
				firstName						: familyContact.first_name,
				lastName						: familyContact.last_name,
				gender							: familyContact.gender,
				workPhone						: familyContact.work_phone,
				workPhoneExt					: familyContact.work_phone_ext,
				email							: familyContact.email,
				occupation						: familyContact.occupation,
				raceId							: familyContact.rce_id,
				dateOfBirth						: familyContact.date_of_birth,
				cellPhone						: familyContact.cell_phone,
				preferredCommunicationMethod	: familyContact.preferred_contact_method
			}

			if( newFamilyContactsMap[ familyId ] ) {

					newFamilyContactsMap[ familyId ].add( newContact );

			} else {

				let newContactSet = new Set( [ newContact ] );
				// create an entry containing a set with the one support service
				newFamilyContactsMap[ familyId ] = newContactSet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateFamilyContacts = function* generateFamilyContacts() {
	// used for debugging unique key entries
	console.log( `getting duplicates` );

	const dupes = utilityFunctions.getDuplicateDetails( 'email', 'fam_id', familyContacts );

	Object.keys( dupes ).length === 0 ?
		console.log( `0 duplicate family contact emails found, no errors expected` ) :
		console.log( `${ dupes.length } duplicate family contact emails found, get ready for a bumpy ride` );

	console.log( `creating family contacts in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords				= Object.keys( newFamilyContactsMap ).length,

		remainingRecords 			= totalRecords,
		batchCount					= 100, // number of records to be process simultaneously
		familyContactNumber			= 0; // keeps track of the current family contactsnumber being processed.  Used for batch processing
	// loop through each family contact object we need to create a record for
	for( let key in newFamilyContactsMap ) {
		// increment the familyContactNumber
		familyContactNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( familyContactNumber % batchCount === 0 ) {
			yield exports.updateFamilyRecord( newFamilyContactsMap[ key ], key, true );
		} else {
			exports.updateFamilyRecord( newFamilyContactsMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `family contact groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished appending ${ totalRecords } family contact groups in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Family contacts',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return familyContactsImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateFamilyRecord = ( contacts, familyId, pauseUntilSaved ) => {

	const contactsArray = Array.from( contacts );

	// fetch the family
	const familyLoaded = utilityModelFetch.getFamilyByRegistrationNumber( familyId );

	familyLoaded.then( family => {

		if( !family ) {
			throw new Error( `family not found with registration number: ${ familyId }` );
		}

		if( contactsArray.length > 2 ) {
			console.log( 'too many contacts in this family' );
		}

		const contact1 = contactsArray.filter( contact => contact.index === '1' )[ 0 ];
		const contact2 = contactsArray.filter( contact => contact.index === '2' )[ 0 ];

		if( contact1 ) {

			const preferredCommunicationMethod = contact1.preferredCommunicationMethod === 'H' ? 'home phone' :
											  contact1.preferredCommunicationMethod === 'C' ? 'mobile phone' :
											  contact1.preferredCommunicationMethod === 'W' ? 'work phone' :
											  contact1.preferredCommunicationMethod === 'E' ? 'email' :
											  contact1.preferredCommunicationMethod === 'U' ? 'unknown' :
											  undefined;

			family.contact1.name.first						= contact1.firstName.trim(),
			family.contact1.name.last						= contact1.lastName.trim(),
			family.contact1.phone.work						= `${ contact1.workPhone.trim() } ${ contact1.workPhoneExt.trim() }`,
			family.contact1.phone.mobile					= contact1.cellPhone.trim(),
			family.contact1.email							= contact1.email ? contact1.email : undefined,
			family.contact1.preferredCommunicationMethod	= preferredCommunicationMethod,
			family.contact1.gender							= gendersMap[ contact1.gender ],
			family.contact1.race							= contact1.raceId ? racesMap[ contact1.raceId ] : racesMap[ 17 ], // if the race id exists, set it, otherwise, set it to 'unknown'
			family.contact1.occupation						= contact1.occupation.trim(),
			family.contact1.birthDate						= contact1.dateOfBirth.trim() ? new Date( contact1.dateOfBirth ) : undefined
		}

		if( contact2 ) {

			const preferredCommunicationMethod = contact2.preferredCommunicationMethod === 'H' ? 'home phone' :
											  contact2.preferredCommunicationMethod === 'C' ? 'mobile phone' :
											  contact2.preferredCommunicationMethod === 'W' ? 'work phone' :
											  contact2.preferredCommunicationMethod === 'E' ? 'email' :
											  contact2.preferredCommunicationMethod === 'U' ? 'unknown' :
											  undefined;

			family.contact2.name.first						= contact2.firstName.trim(),
			family.contact2.name.last						= contact2.lastName.trim(),
			family.contact2.phone.work						= `${ contact2.workPhone.trim() } ${ contact2.workPhoneExt.trim() }`,
			family.contact2.phone.mobile					= contact2.cellPhone.trim(),
			family.contact2.email							= contact2.email ? contact2.email : undefined,
			family.contact2.preferredCommunicationMethod	= preferredCommunicationMethod,
			family.contact2.gender							= gendersMap[ contact2.gender ],
			family.contact2.race							= contact2.raceId ? racesMap[ contact2.raceId ] : racesMap[ 17 ],
			family.contact2.occupation						= contact2.occupation.trim(),
			family.contact2.birthDate						= contact2.dateOfBirth.trim() ? new Date( contact2.dateOfBirth ) : undefined
		}

		family.email = family.contact1.email ? family.contact1.email.toLowerCase() :
					   family.contact2.email ? family.contact2.email.toLowerCase() :
					   family.email;

		// save the updated family record
		family.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				console.log( `registration number: ${ family.registrationNumber }` );
				console.log( `contact 1 email: ${ family.contact1.email ? family.contact1.email.toLowerCase() : '' }` );
				console.log( `contact 2 email: ${ family.contact2.email ? family.contact2.email.toLowerCase() : '' }` );
				// store a reference to the entry that caused the error
				importErrors.push( { id: family.get( 'registrationNumber' ), contact1: contact1.fmc_id, contact2: contact2.fmc_id, error: err.err } );
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					familyContactGenerator.next();
				}, 1000 );
			}
		});
	})
	.catch( err => {
		importErrors.push( err );

		// fire off the next iteration of our generator after pausing
		if( pauseUntilSaved ) {
			setTimeout( () => {
				familyContactGenerator.next();
			}, 1000 );
		}
	})
};

// instantiates the generator used to create family records at a regulated rate
const familyContactGenerator = exports.generateFamilyContacts();