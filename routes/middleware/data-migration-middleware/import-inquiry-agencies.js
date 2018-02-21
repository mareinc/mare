const keystone					= require( 'keystone' );
const Inquiry 					= keystone.list( 'Inquiry' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all inquiry agencies.  This is created here to be available to multiple functions below
let inquiryAgencies;
// create an object to hold the inquiry agencies
let newInquiryAgenciesMap = {};
// expose done to be available to all functions below
let inquiryAgenciesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendInquiryAgencies = ( req, res, done ) => {
	// expose done to our generator
	inquiryAgenciesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the inquiry agencies CSV file to JSON
	const inquiryAgenciesLoaded = CSVConversionMiddleware.fetchInquiryAgencies();

	// if the file was successfully converted, it will return the array of inquiry agencies
	inquiryAgenciesLoaded.then( inquiryAgenciesArray => {
		// store the inquiry agencies in a variable accessible throughout this file
		inquiryAgencies = inquiryAgenciesArray;
		// call the function to build the sibling map
		exports.buildInquiryAgenciesMap();
		// kick off the first run of our generator
		inquiryAgencyGenerator.next();
	// if there was an error converting the inquiry agencies file
	}).catch( reason => {
		console.error( `error processing inquiry agencies` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildInquiryAgenciesMap = () => {
	// load all inquiry agencies
	for( let inquiryAgency of inquiryAgencies ) {
		// for each inquiry agency, get the inquiry id
		const inquiryId = inquiryAgency.cll_id;
	 	// and use the id as a key, and add each inquiry agency's _id in a key object
		if( inquiryId ) {

			if( newInquiryAgenciesMap[ inquiryId ] ) {

				newInquiryAgenciesMap[ inquiryId ].add( inquiryAgency.agn_id );

			} else {

				let newInquiryAgencySet = new Set( [ inquiryAgency.agn_id ] );
				// create an entry containing a set with the one inquiry agency
				newInquiryAgenciesMap[ inquiryId ] = newInquiryAgencySet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateInquiryAgencies = function* generateInquiryAgencies() {

	console.log( `creating inquiry agencies in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords						= Object.keys( newInquiryAgenciesMap ).length,
		remainingRecords 					= totalRecords,
		batchCount							= 10, // number of records to be process simultaneously
		inquiryAgencyNumber					= 0; // keeps track of the current inquiry agency number being processed.  Used for batch processing
	// loop through each inquiry agency object we need to create a record for
	for( let key in newInquiryAgenciesMap ) {
		// increment the inquiryAgencyNumber
		inquiryAgencyNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( inquiryAgencyNumber % batchCount === 0 ) {
			yield exports.updateInquiryRecord( newInquiryAgenciesMap[ key ], key, true );
		} else {
			exports.updateInquiryRecord( newInquiryAgenciesMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `inquiry agency groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished appending ${ totalRecords } inquiry agency groups in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'inquiry agencies',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return inquiryAgenciesImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateInquiryRecord = ( agencyIds, inquiryId, pauseUntilSaved ) => {

	// fetch the inquiry
	const inquiryLoaded = utilityModelFetch.getInquiryById( inquiryId );
	// create a promise
	const agenciesLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the _ids from agencies
		utilityModelFetch.getAgencyIdsByOldIds( resolve, reject, agencyIds );
	});

	Promise.all( [ inquiryLoaded, agenciesLoaded ] )
		.then( values => {

			const [ inquiry, inquiryAgencies ] = values;

			inquiry.agencyReferrals = inquiryAgencies;

			// save the updated inquiry record
			inquiry.save( ( err, savedModel ) => {
				// if we run into an error
				if( err ) {
					// store a reference to the entry that caused the error
					importErrors.push( { id: inquiry.get( '_id' ), error: err } );
				}

				// fire off the next iteration of our generator after pausing
				if( pauseUntilSaved ) {
					setTimeout( () => {
						inquiryAgencyGenerator.next();
					}, 1000 );
				}
			});
		})
		.catch( err => {
			// we can assume it was a reject from trying to fetch the city or town by an unrecognized name
			importErrors.push( { id: inquiryId, error: `error adding agencies with ids ${ agencyIds } to inquiry with id ${ inquiryId } - ${ err }` } );

			if( pauseUntilSaved ) {
				setTimeout( () => {
					inquiryAgencyGenerator.next();
				}, 1000 );
			}
		});
};

// instantiates the generator used to create inquiry agency records at a regulated rate
const inquiryAgencyGenerator = exports.generateInquiryAgencies();