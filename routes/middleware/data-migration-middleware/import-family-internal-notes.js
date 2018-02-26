const keystone					= require( 'keystone' ),
	  InternalNote 				= keystone.list( 'Internal Note' ),
	  // services
	  userService				= require( '../service_user' ),
	  // utility middleware
	  utilityFunctions			= require( './utilities_functions' ),
	  utilityModelFetch			= require( './utilities_model-fetch' ),
	  // csv conversion middleware
	  CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create a map to hold all internal notes.  These are created here to be available to multiple functions below
let internalNotes;
// create a map to hold just the latest version of each note
let internalNotesMap = new Map();
// expose done to be available to all functions below
let internalNotesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

// fetch the website bot as a backup admin
const fetchMigrationBot = userService.getUserByFullName( 'Migration Bot', 'Admin' );

module.exports.importInternalNotes = ( req, res, done ) => {
	// expose done to our generator
	internalNotesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the internal notes CSV file to JSON
	const internalNotesLoaded = CSVConversionMiddleware.fetchFamilyInternalNotes();
	// if the file was successfully converted, it will return the array of internal notes
	internalNotesLoaded
		.then( internalNotesArray => {
			// store the internal notes in a variable accessible throughout this file
			internalNotes = internalNotesArray.filter( internalNote => internalNote.field_change_summary.indexOf( 'Internal Notes' ) !== -1 );
			// call the function to build the internal notes map
			exports.buildInternalNotesMap();
			// kick off the first run of our generator
			internalNoteGenerator.next();
		// if there was an error converting the internal notes file
		}).catch( err => {
			console.error( `error processing child internal notes - ${ err }` );
			// aborting the import
			return done();
		});
};

module.exports.buildInternalNotesMap = () => {
	// load all placement sources
	for( let internalNote of internalNotes ) {
		// for each placement source, get the inquiry id
		const familyId = internalNote.fam_id;
	 	// and use the id as a key, and add each placement source's _id in a key object
		if( familyId ) {

			if( internalNotesMap.has( familyId ) &&
				parseInt( internalNotesMap.get( familyId ).version, 10 ) < parseInt( internalNote.version_number, 10 ) ) {

				internalNotesMap.set( familyId, { version: internalNote.version_number, model: internalNote } );

			} else if( !internalNotesMap.has( familyId ) ) {
				// create an entry containing a set with the one placement source
				internalNotesMap.set( familyId, { version: internalNote.version_number, model: internalNote } );
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateInternalNotes = function* generateInternalNotes() {
	
	// create monitor variables to assess how many records we still need to process
	let totalRecords		= internalNotesMap.size,
		remainingRecords 	= totalRecords,
		batchCount			= 200, // number of records to be process simultaneously
		internalNoteNumber	= 0; // keeps track of the current internal note group being processed.  Used for batch processing
	
	console.log( `creating ${ totalRecords } internal notes in the new system` );
	
	// loop through each internal note we need to create a record for, and extract the key / array pair
	for( let [ key, internalNote ] of internalNotesMap ) {
		// increment the internalNoteNumber
		internalNoteNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( internalNoteNumber % batchCount === 0 ) {
			yield exports.createInternalNoteRecord( internalNote.model, true );
		} else {
			exports.createInternalNoteRecord( internalNote.model, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;

		if( remainingRecords % 500 === 0 ) {
			console.log( `internal note groups remaining: ${ remainingRecords }` );
		}
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } family internal notes in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'family internal notes',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return internalNotesImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.createInternalNoteRecord = ( internalNote, pauseUntilSaved ) => {
	// if the notes field exists, we should create a new record
	if( internalNote.notes ) {
		// fetch the family specified in the placement
		const fetchFamily = utilityModelFetch.getFamilyByRegistrationNumber( internalNote.fam_id );
		// fetch the admin who took the note
		const fetchCreatedBy = utilityModelFetch.getAdminById( internalNote.created_by );
		// once the family is fetched
		Promise.all( [ fetchFamily, fetchCreatedBy, fetchMigrationBot ] )
			.then( values => {

				let [ family, createdBy, migrationBot ] = values;

				let newInternalNote = new InternalNote.model({
					target		: 'family',
					family		: family ? family.get( '_id' ) : undefined,
					date		: new Date( internalNote.created_datetime ),
					note		: internalNote.notes,
					employee	: createdBy ? createdBy.get( '_id' ) : undefined
				});

				// save the new family internal note record
				newInternalNote.save( ( err, savedModel ) => {
					// if we run into an error
					if( err ) {
						// store a reference to the entry that caused the error
						importErrors.push( { id: internalNote.fam_h_id, error: err } );
					}

					// fire off the next iteration of our generator after pausing
					if( pauseUntilSaved ) {
						setTimeout( () => {
							internalNoteGenerator.next();
						}, 1000 );
					}
				});
			})
			.catch( err => {
				// we can assume it was a reject from trying to fetch the city or town by an unrecognized name
				importErrors.push( { id: internalNote.fam_h_id, error: `error creating internal note - ${ err }` } );

				if( pauseUntilSaved ) {
					setTimeout( () => {
						internalNoteGenerator.next();
					}, 1000 );
				}
			});
	// if the notes field is empty
	} else {
		if( pauseUntilSaved ) {
			setTimeout( () => {
				internalNoteGenerator.next();
			}, 1000 );
		}
	}
};

// instantiates the generator used to create family records at a regulated rate
const internalNoteGenerator = exports.generateInternalNotes();

// 58543