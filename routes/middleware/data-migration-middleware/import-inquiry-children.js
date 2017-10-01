const keystone					= require( 'keystone' );
const Inquiry 					= keystone.list( 'Inquiry' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all inquiry children.  This is created here to be available to multiple functions below
let inquiryChildren;
// create an object to hold the inquiry children
let newInquiryChildrenMap = {};
// expose done to be available to all functions below
let inquiryChildrenImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendInquiryChildren = ( req, res, done ) => {
	// expose done to our generator
	inquiryChildrenImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the inquiry children CSV file to JSON
	const inquiryChildrenLoaded = CSVConversionMiddleware.fetchInquiryChildren();

	// if the file was successfully converted, it will return the array of inquiry children
	inquiryChildrenLoaded.then( inquiryChildrenArray => {
		// store the inquiry children in a variable accessible throughout this file
		inquiryChildren = inquiryChildrenArray;
		// call the function to build the sibling map
		exports.buildInquiryChildrenMap();
		// kick off the first run of our generator
		inquiryChildGenerator.next();
	// if there was an error converting the inquiry children file
	}).catch( reason => {
		console.error( `error processing inquiry children` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildInquiryChildrenMap = () => {
	// load all inquiry children
	for( let inquiryChild of inquiryChildren ) {
		// for each inquiry child, get the inquiry id
		const inquiryId = inquiryChild.cll_id;
	 	// and use the id as a key, and add each inquiry child's _id in a key object
		if( inquiryId ) {

			if( newInquiryChildrenMap[ inquiryId ] ) {

				newInquiryChildrenMap[ inquiryId ].add( inquiryChild.agn_id );

			} else {

				let newInquiryAgencySet = new Set( [ inquiryChild.agn_id ] );
				// create an entry containing a set with the one inquiry child
				newInquiryChildrenMap[ inquiryId ] = newInquiryAgencySet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateInquiryChildren = function* generateInquiryChildren() {

	console.log( `creating inquiry children in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords						= Object.keys( newInquiryChildrenMap ).length,
		remainingRecords 					= totalRecords,
		batchCount							= 10, // number of records to be process simultaneously
		inquiryChildNumber					= 0; // keeps track of the current inquiry child number being processed.  Used for batch processing
	// loop through each inquiry child object we need to create a record for
	for( let key in newInquiryChildrenMap ) {
		// increment the inquiryChildNumber
		inquiryChildNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( inquiryChildNumber % batchCount === 0 ) {
			yield exports.updateInquiryRecord( newInquiryChildrenMap[ key ], key, true );
		} else {
			exports.updateInquiryRecord( newInquiryChildrenMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `inquiry child groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			const resultsMessage = `finished appending ${ totalRecords } inquiry child groups in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'inquiry children',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return inquiryChildrenImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateInquiryRecord = ( childIds, inquiryId, pauseUntilSaved ) => {

	// create a promise
	const inquiryLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the inquiry
		utilityModelFetch.getInquiryById( resolve, reject, inquiryId );
	});
	// create a promise
	const childrenLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the _ids from children
		utilityModelFetch.getChildIdsByRegistrationNumbers( resolve, reject, childIds );
	});

	Promise.all( [ inquiryLoaded, childrenLoaded ] ).then( values => {

		const [ inquiry, inquiryChildren ] = values;

		inquiry.child = inquiryChildren; // IMPORTANT: right now this is a single select field you're storing an array in.  The assumption is this will need to change to handle sibling groups

		// save the updated inquiry record
		inquiry.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// halt execution by throwing an error
				console.log( `error: ${ err }` );
				throw `[inquiry id: ${ inquiry.get( '_id' ) }] an error occured while appending a child to the inquiry record.`;
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					inquiryChildGenerator.next();
				}, 1000 );
			}
		});
	});
};

// instantiates the generator used to create inquiry child records at a regulated rate
const inquiryChildGenerator = exports.generateInquiryChildren();