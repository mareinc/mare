const keystone					= require( 'keystone' ),
	  ChildInternalNote 		= keystone.list( 'Internal Note' ),
	  // services
	  userService				= require( '../service_user' ),
	  // utility middleware
	  utilityFunctions			= require( './utilities_functions' ),
	  utilityModelFetch			= require( './utilities_model-fetch' ),
	  // csv conversion middleware
	  CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create a map to hold all child internal notes.  These are created here to be available to multiple functions below
let childInternalNotes = new Map();
// expose done to be available to all functions below
let childInternalNotesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importInternalNotes = ( req, res, done ) => {
	// expose done to our generator
	childInternalNotesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the child internal notes CSV file to JSON
	const childInternalNotesLoaded = CSVConversionMiddleware.fetchInternalNotes();
	// if the file was successfully converted, it will return the array of child internal notes
	childInternalNotesLoaded
		.then( childInternalNotesArray => {

			for( let childInternalNote of childInternalNotesArray ) {
				if( childInternalNotes.has( childInternalNote.chd_id ) ) {
					childInternalNotes.get( childInternalNote.chd_id ).push( childInternalNote );
				} else {
					childInternalNotes.set( childInternalNote.chd_id, [ childInternalNote ] );
				}
			}

			// kick off the first run of our generator
			childInternalNoteGenerator.next();
		// if there was an error converting the child internal notes file
		}).catch( reason => {
			console.error( `error processing child internal notes - ${ reason }` );
			// aborting the import
			return done();
		});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateChildInternalNotes = function* generateChildInternalNotes() {
	
	console.log( `creating child internal notes in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords				= childInternalNotes.size,
		remainingRecords 			= totalRecords,
		batchCount					= 20, // number of records to be process simultaneously
		childInternalNotesNumber	= 0; // keeps track of the current child internal note group being processed.  Used for batch processing
	// loop through each child internal note we need to create a record for, and extract the key / array pair
	for( let [ childId, childInternalNote ] of childInternalNotes ) {
		// increment the childInternalNotesNumber
		childInternalNotesNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( childInternalNotesNumber % batchCount === 0 ) {
			yield exports.createChildInternalNoteRecord( childId, childInternalNote, true );
		} else {
			exports.createChildInternalNoteRecord( childId, childInternalNote, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `child internal note groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } child internal notes in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Child internal notes',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return childInternalNotesImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.createChildInternalNoteRecord = ( childId, childInternalNoteArray, pauseUntilSaved ) => {

	// fetch the child associated with the current target child as a base comparison
	let fetchCurrentChild = utilityModelFetch.getChildByRegistrationNumber( childId );
	// once the child is fetched
	fetchCurrentChild.then( currentChild => {
		// loop through all the entries of the child internal note array
		for( let childInternalNote of childInternalNoteArray ) {
			// create a promise for fetching the admin who created the internal note entry, and set it to Migration Bot if none is listed
			const adminLoaded = !childInternalNote.created_by
								? userService.getUserByFullName( 'Migration Bot', 'Admin' )
								: utilityModelFetch.getAdminById( childInternalNote.created_by );

			adminLoaded.then( admin => {
				// IMPORTANT TODO: where you left off, the first entry in each set of changes has name and other information,
				//				   need to determine how to save those entries.  First thought is load the child, and check the fields that always appear
				//				   such as name, if it hasn't changed, don't update it.  You'll need to load the child, create a copy of the child
				//				   make changes to the copy, then pass both into the change internal note function with the date and admin to associate it with.
				// loop through the child internal note entries and translate all fields to values for the new system
				// if it's the first element in the array, don't pass the old object so it creates the 'record created' message
				// create the child internal note record with the appended changes
				// update the existing internal note creation scripts to remove the FROM label and value, and just use the TO label and value
				// create a new child internal note
				let newInternalNote = new ChildInternalNote.model({
					// LEFT OFF HERE, NEED TO COMPARE EACH FIELD FOR CHANGES
					child		: child.get( '_id' ),
					date		: new Date( childInternalNote.created_datetime ),
					changes		: '', // need to extract these based on what's different from the current child
					modifiedBy	: admin
				});

				// save the new child internal note record
				newInternalNote.save( ( err, savedModel ) => {
					// if we run into an error
					if( err ) {
						// store a reference to the entry that caused the error
						importErrors.push( { id: childInternalNote.chd_h_id, error: err } );
					}

					// fire off the next iteration of our generator after pausing
					if( pauseUntilSaved ) {
						setTimeout( () => {
							childInternalNoteGenerator.next();
						}, 1000 );
					}
				});
			});
		}
	});
};

// instantiates the generator used to create family records at a regulated rate
const childInternalNoteGenerator = exports.generateChildInternalNotes();