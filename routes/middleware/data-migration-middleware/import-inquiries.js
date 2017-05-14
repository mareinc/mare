const keystone					= require( 'keystone' );
const Inquiry 					= keystone.list( 'Inquiry' );
// utility middleware
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all inquiries.  This is created here to be available to multiple functions below
let inquiries;
// create references to the map we stored on locals.  This is bound here to be available to multiple functions below since res can't be passed to the generator
let inquiryMethodsMap;
// expose done to be available to all functions below
let inquiryImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importInquiries = ( req, res, done ) => {
	// expose the map we'll need for this import
	inquiryMethodsMap = res.locals.migration.maps.inquiryMethods;
	// expose done to our generator
	inquiryImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the inquiries CSV file to JSON
	const inquiriesLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the inquiries
		CSVConversionMiddleware.fetchCallInquiries( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of inquiries
	inquiriesLoaded.then( inquiriesArray => {
		// store the inquiries in a variable accessible throughout this file
		inquiries = inquiriesArray;
		// kick off the first run of our generator
		inquiryGenerator.next();
	// if there was an error converting the inquiries file
	}).catch( reason => {
		console.error( `error processing inquiries` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateInquiries = function* generateInquiries() {

	console.log( `creating inquiries in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords		= inquiries.length,
		remainingRecords 	= totalRecords,
		batchCount			= 200, // number of records to be process simultaneously
		inquiryNumber		= 0; // keeps track of the current inquiry number being processed.  Used for batch processing
	// loop through each inquiry object we need to create a record for
	for( let inquiry of inquiries ) {
		// increment the inquiryNumber
		inquiryNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( inquiryNumber % batchCount === 0 ) {
			yield exports.createInquiryRecord( inquiry, true );
		} else {
			exports.createInquiryRecord( inquiry, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `inquiries remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {
			
			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } inquiries in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Inquiries',
				results: resultsMessage
			});
			
			console.log( resultsMessage );
			// return control to the data migration view
			return inquiriesImportComplete();
		}
	}
};

/* the import function for agencies */
module.exports.createInquiryRecord = ( inquiry, pauseUntilSaved ) => {

	// *cll_id
	// **agc_id: inquirer
	// **fam_id
	// ***taken_by
	// *call_date
	// *inquiry_type
	// **inquiry_method
	// *rcs_id
	// recruitment_agc_id: child's social worker
	// ?confirm_print_date: means that the call was taken, then an admin went in and made sure the inquirer had a confirmation sent.  This marks the final two checkboxes
	// ?generate_letter
	// ?scheduled_print_date
	// ?last_print_date
	// ?generate_confirmation
	// *family: on behalf of

	// sets variables to make determining which emails should be marked as sent easier
	const isFamilyInquiry		= !!inquiry.fam_id,
		  isSocialWorkerInquiry	= !!inquiry.agc_id,
		  isGeneralInquiry		= inquiry.inquiry_type === 'G',
		  isChildInquiry		= inquiry.inquiry_type === 'C',
		  isComplaint			= inquiry.inquiry_type === 'L',
		  isOnBehalfOfFamily	= !!inquiry.family,
		  isInquiryApproved		= !!inquiry.confirm_print_date,
		  isEmailInquiry		= inquiry.inquiry_method === 'E',
		  isPhoneInquiry		= inquiry.inquiry_method === 'P',
		  isInPersonInquiry		= inquiry.inquiry_method === 'I'

	if( !isEmailInquiry && !isPhoneInquiry && !isInPersonInquiry ) {
		console.log( inquiry.inquiry_method );
	}

	if( !isGeneralInquiry && !isChildInquiry && !isComplaint ) {
		console.log( inquiry.inquiry_type );
	}

	if( !isFamilyInquiry && !isSocialWorkerInquiry ) {
		console.log( 'no valid inquirer' );
	}

	// create a promise
	const adminLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the admin who created the inquiry
		utilityModelFetch.getAdminById( resolve, reject, inquiry.taken_by );
	});
	// create a promise
	const socialWorkerLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the social worker responsible for the inquiry
		utilityModelFetch.getSocialWorkerById( resolve, reject, inquiry.agc_id );
	});
	// create a promise
	const familyLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the family responsible for the inquiry
		utilityModelFetch.getFamilyByRegistrationNumber( resolve, reject, inquiry.fam_id );
	});
	// create a promise
	const sourceLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the recruitment source
		utilityModelFetch.getSourceById( resolve, reject, inquiry.rcs_id );
	});

	Promise.all( [ adminLoaded, socialWorkerLoaded, familyLoaded, sourceLoaded ] ).then( values => {
		// store the retrieved admin social worker, and family in local variables
		const [ admin, socialWorker, family, source ] = values;

		let newInquiry = new Inquiry.model({

			takenBy: admin.get( '_id' ),
			takenOn: new Date( inquiry.call_date ),

			inquirer: isFamilyInquiry ? 'family' :
					  isSocialWorkerInquiry ? 'social worker' :
					  undefined,

			inquiryType: isChildInquiry ? 'child inquiry'
						 : isGeneralInquiry ? 'general inquiry'
						 : undefined,

			inquiryMethod: inquiryMethodsMap[ inquiry.inquiry_method ],

			source: source.get( '_id' ),
			
			family: isFamilyInquiry ? family.get( '_id' ) : undefined,
			socialWorker: isSocialWorkerInquiry ? socialWorker.get( '_id' ) : undefined,
			onBehalfOfMAREFamily: false,
			onBehalfOfFamilyText: inquiry.family,

			thankInquirer: true,
			inquiryAccepted: isInquiryApproved,

			emailSentToStaff: true, // no deps
			thankYouSentToInquirer: true, // no deps
			thankYouSentToFamilyOnBehalfOfInquirer: isSocialWorkerInquiry && isOnBehalfOfFamily, // social worker inquiry, on behalf of family
			approvalEmailSentToInquirer: isInquiryApproved, // no deps
			approvalEmailSentToFamilyOnBehalfOfInquirer: isSocialWorkerInquiry && isOnBehalfOfFamily && isInquiryApproved, // social worker inquiry, on behalf of family
			emailSentToChildsSocialWorker: ( isChildInquiry || isComplaint ) && isInquiryApproved, // child inquiry, isComplaint, or family support consultation.  We only capture child inquiries
			emailSentToAgencies: isGeneralInquiry && isInquiryApproved, // general inquiry

			oldId: inquiry.cll_id

		});

		newInquiry.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// store a reference to the entry that caused the error
				importErrors.push( { id: inquiry.cll_id, error: err.err } );
			}
			
			// fire off the next iteration of our generator after pausing for a second
			if( pauseUntilSaved ) {
				setTimeout( () => {
					inquiryGenerator.next();
				}, 1000 );
			}
		});
	});
};

// instantiates the generator used to create agency records at a regulated rate
const inquiryGenerator = exports.generateInquiries();