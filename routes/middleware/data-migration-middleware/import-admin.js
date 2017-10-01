const keystone		= require( 'keystone' );
const Types 		= keystone.Field.Types;
const Admin			= keystone.list( 'Admin' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all admin.  This is created here to be available to multiple functions below
let admins;
// expose done to be available to all functions below
let adminsImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importAdmin = ( req, res, done ) => {
	// expose done to our generator
	adminsImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the admin CSV file to JSON
	const adminsLoaded = CSVConversionMiddleware.fetchAdmins();
	
	// if the file was successfully converted, it will return the array of admin
	adminsLoaded.then( adminArray => {
		// store the admin in a variable accessible throughout this file
		admins = adminArray;
		// kick off the first run of our generator
		adminGenerator.next();
	// if there was an error converting the admin file
	}).catch( reason => {
		console.error( `error processing admins` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateAdmin = function* generateAdmin() {
	
	console.log( `creating admin in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords		= admins.length,
		remainingRecords 	= totalRecords,
		batchCount			= 1, // number of records to be process simultaneously
		adminNumber			= 0; // keeps track of the current admin number being processed.  Used for batch processing
	// loop through each admin object we need to create a record for
	for( let admin of admins ) {
		// increment the adminNumber
		adminNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( adminNumber % batchCount === 0 ) {
			yield exports.createAdminRecord( admin, true );
		} else {
			exports.createAdminRecord( admin, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `admin remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } admin in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Admin',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return adminsImportComplete();
		}
	}
}

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.createAdminRecord = ( admin, pauseUntilSaved ) => {
	// populate fields of a new admin object
	let newAdmin = new Admin.model({

		password: admin.password_hash, // need to decrypt this to make the logins usable

		isActive: false,

		permissions: {
			isVerified: admin.email.trim() ? true : false // they can only have verified their email address if they have one
		},

		name: {
			first: admin.first_name.trim(),
			last: admin.last_name.trim()
		},
		// TODO: every admin needs an email address, this is just a placeholder until Lisa tells us how to handle these records
		email: admin.email.trim() && admin.email !== 'x@x.com' // several admin are set to x@x.com when no email is given/known, which breaks the import
					? admin.email.trim().toLowerCase()
					: `admin${ admin.usr_id }@email.com`,

		phone: {
			work: `(617) 542 3678 x${ admin.phone_ext.trim() }`,
			preferred: 'work'
		},

		oldId: admin.usr_id
	});

	newAdmin.save( ( err, savedModel ) => {
		// if we run into an error
		if( err ) {
			// store a reference to the entry that caused the error
			importErrors.push( { id: admin.usr_id, error: err.err } );
		}

		// fire off the next iteration of our generator after pausing
		if( pauseUntilSaved ) {
			adminGenerator.next();
		}
	});
};

// instantiates the generator used to create admin records at a regulated rate
const adminGenerator = exports.generateAdmin();