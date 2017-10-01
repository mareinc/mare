const keystone					= require( 'keystone' );
const Inquiry 					= keystone.list( 'Inquiry' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all inquiry notes.  This is created here to be available to multiple functions below
let inquiryNotes;
// create an object to hold the inquiry notes
let newInquiryNotesMap = {};
// expose done to be available to all functions below
let inquiryNotesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendInquiryNotes = ( req, res, done ) => {
	// expose done to our generator
	inquiryNotesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the inquiry notes CSV file to JSON
	const inquiryNotesLoaded = CSVConversionMiddleware.fetchInquiryNotes();

	// if the file was successfully converted, it will return the array of inquiry notes
	inquiryNotesLoaded.then( inquiryNotesArray => {
		// store the inquiry notes in a variable accessible throughout this file
		inquiryNotes = inquiryNotesArray;
		// call the function to build the sibling map
		exports.buildInquiryNotesMap();
		// kick off the first run of our generator
		inquiryNoteGenerator.next();
	// if there was an error converting the inquiry notes file
	}).catch( reason => {
		console.error( `error processing inquiry notes` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildInquiryNotesMap = () => {
	// load all inquiry notes
	for( let inquiryNote of inquiryNotes ) {
		// for each inquiry note, get the inquiry id
		const inquiryId = inquiryNote.cll_id;
	 	// and use the id as a key, and add each inquiry note's _id in a key object
		if( inquiryId ) {

			if( newInquiryNotesMap[ inquiryId ] ) {

				newInquiryNotesMap[ inquiryId ].add( inquiryNote.agn_id );

			} else {

				let newInquiryAgencySet = new Set( [ inquiryNote.agn_id ] );
				// create an entry containing a set with the one inquiry note
				newInquiryNotesMap[ inquiryId ] = newInquiryAgencySet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateInquiryNotes = function* generateInquiryNotes() {

	console.log( `creating inquiry notes in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords						= Object.keys( newInquiryNotesMap ).length,
		remainingRecords 					= totalRecords,
		batchCount							= 10, // number of records to be process simultaneously
		inquiryNoteNumber					= 0; // keeps track of the current inquiry note number being processed.  Used for batch processing
	// loop through each inquiry note object we need to create a record for
	for( let key in newInquiryNotesMap ) {
		// increment the inquiryNoteNumber
		inquiryNoteNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( inquiryNoteNumber % batchCount === 0 ) {
			yield exports.updateInquiryRecord( newInquiryNotesMap[ key ], key, true );
		} else {
			exports.updateInquiryRecord( newInquiryNotesMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `inquiry note groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished appending ${ totalRecords } inquiry note groups in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'inquiry notes',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return inquiryNotesImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateInquiryRecord = ( noteIds, inquiryId, pauseUntilSaved ) => {

	// create a promise
	const inquiryLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the inquiry
		utilityModelFetch.getInquiryById( resolve, reject, inquiryId );
	});

	inquiryLoaded.then( inquiry => {

		inquiry.note = inquiryNotes;

		// save the updated inquiry record
		inquiry.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// store a reference to the entry that caused the error
				importErrors.push( { id: inquiry.get( '_id' ), error: err.err } );
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					inquiryNoteGenerator.next();
				}, 1000 );
			}
		});
	});
};

// instantiates the generator used to create inquiry note records at a regulated rate
const inquiryNoteGenerator = exports.generateInquiryNotes();