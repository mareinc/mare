// MISSING FIELD: position.  This is needed when binding models to social workers
// NOT DONE: we need to figure out a better solution to the email field.  The placeholders are temporary until Lisa weighs in

const keystone		= require( 'keystone' );
const Types 		= keystone.Field.Types;
const SocialWorker  = keystone.list( 'Social Worker' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all social workers.  This is created here to be available to multiple functions below
let socialWorkers;
// expose done to be available to all functions below
let socialWorkerImportComplete;
// expose the array storing progress through the migration run
let migrationResults;

module.exports.importSocialWorkers = ( req, res, done ) => {
	// expose done to our generator
	socialWorkerImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the social workers CSV file to JSON
	const socialWorkersLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the social workers
		CSVConversionMiddleware.fetchSocialWorkers( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of social workers
	socialWorkersLoaded.then( socialWorkersArray => {
		// store the social workers in a variable accessible throughout this file
		socialWorkers = socialWorkersArray;
		// kick off the first run of our generator
		socialWorkerGenerator.next();
	// if there was an error converting the social workers file
	}).catch( reason => {
		console.error( `error processing social workers` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateSocialWorkers = function* generateSocialWorkers() {
	// used for debugging unique key entries
	console.log( `getting duplicates` );
	const dupes = utilityFunctions.getDuplicates( 'email', socialWorkers );
	console.log( `${ dupes.length } duplicate social worker emails found, no errors expected` );

	console.log( `creating social workers in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords			= socialWorkers.length,
		remainingRecords 		= totalRecords,
		batchCount				= 50, // number of records to be process simultaneously
		socialWorkerNumber		= 0; // keeps track of the current social worker number being processed.  Used for batch processing
	// loop through each social worker object we need to create a record for
	for( let socialWorker of socialWorkers ) {
		// increment the socialWorkerNumber
		socialWorkerNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( socialWorkerNumber % batchCount === 0 ) {
			console.log( 'pausing' );
			yield exports.createSocialWorkerRecord( socialWorker, true );
		} else {
			exports.createSocialWorkerRecord( socialWorker, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `social workers remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			const resultsMessage = `finished creating ${ totalRecords } social workers in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Social Workers',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return socialWorkerImportComplete();
		}
	}
}

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.createSocialWorkerRecord = ( socialWorker, pauseUntilSaved ) => {
	
	// create a placeholder for the agency we're going to fetch related to the current social worker
	let agency;
	// create a promise for fetching the agency associated with the social worker
	const agencyLoaded = new Promise( ( resolve, reject ) => {
		utilityModelFetch.getAgencyById( resolve, reject, socialWorker.agn_id );
	});
	// once we've fetched the agency
	agencyLoaded.then( agency => {
		// populate fields of a new SocialWorker object
		let newSocialWorker = new SocialWorker.model({
			// every social worker needs a password, this will generate one we can easily determine at a later date while still being unique
			password: `${ socialWorker.first_name }_${ socialWorker.last_name }_${ socialWorker.agc_id }`,

			permissions: {
				isVerified: socialWorker.email ? true : false,			// they can only have verified their email address if they have one
				isActive: socialWorker.is_active === 'Y' ? true : false
			},

			name: {
				first: socialWorker.first_name,
				last: socialWorker.last_name
			},
			// TODO: every social worker needs an email address, this is just a placeholder until Lisa tells us how to handle these records
			email: socialWorker.email.toLowerCase() || `placeholder${ socialWorker.agc_id }@email.com`,

			phone: {
				work: socialWorker.phone
			},

			agency: agency.get( '_id' ),
			
			address: {
				street1: agency.address.street1,
				street2: agency.address.street2,
				city: agency.address.city,
				state: agency.address.state,
				zipCode: utilityFunctions.padZipCode( agency.address.zipCode ),
				region: agency.address.region
			},

			notes: socialWorker.notes,
			oldId: socialWorker.agc_id
		});

		newSocialWorker.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// halt execution by throwing an error
 				throw `[agc_id: ${ socialWorker.agc_id }] an error occured while saving ${ socialWorker.first_name } ${ socialWorker.last_name }.`;
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					console.log( 'unpausing' );
					socialWorkerGenerator.next();
				}, 5000 );
			}
		});

	}).catch( reason => {
		console.error( `error processing social worker agency` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

// instantiates the generator used to create social worker records at a regulated rate
const socialWorkerGenerator = exports.generateSocialWorkers();