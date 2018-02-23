const keystone					= require( 'keystone' );
const Inquiry 					= keystone.list( 'Inquiry' );
// services
const userService				= require( '../service_user' );
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
// fetch the website bot as a fallback to the admin if the admin is no longer in the system
const websiteBotLoaded	= userService.getUserByFullName( 'Website Bot', 'admin' );

module.exports.importInquiries = ( req, res, done ) => {
	// expose the map we'll need for this import
	inquiryMethodsMap = res.locals.migration.maps.inquiryMethods;
	// expose done to our generator
	inquiryImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the inquiries CSV file to JSON
	const inquiriesLoaded = CSVConversionMiddleware.fetchCallInquiries();

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
	console.log( totalRecords );
	
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
		if( remainingRecords % 500 === 0 ) {
			console.log( `inquiries remaining: ${ remainingRecords }` );
		}
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
			return inquiryImportComplete();
		}
	}
};

/* the import function for agencies */
module.exports.createInquiryRecord = ( inquiry, pauseUntilSaved ) => {

	// sets variables to make determining which emails should be marked as sent easier
	const isFamilyInquiry				= !!inquiry.fam_id,
		  isSocialWorkerInquiry			= !!inquiry.agc_id,
		  isGeneralInquiry				= inquiry.inquiry_type === 'G',
		  isChildInquiry				= inquiry.inquiry_type === 'C',
		  isComplaint					= inquiry.inquiry_type === 'L',
		  isFamilySupportConsultation 	= inquiry.inquiry_type === 'S',
		  isOnBehalfOfFamily			= !!inquiry.family,
		  isEmailInquiry				= inquiry.inquiry_method === 'E',
		  isPhoneInquiry				= inquiry.inquiry_method === 'P',
		  isInPersonInquiry				= inquiry.inquiry_method === 'I',
		  isMailInquiry					= inquiry.inquiry_method === 'M';

	if( !isEmailInquiry && !isPhoneInquiry && !isInPersonInquiry && !isMailInquiry ) {
		// store a reference to the entry that caused the error
		importErrors.push( { id: inquiry.cll_id, error: `unexpected inquiry method ${ inquiry.inquiry_method }` } );
	}

	if( !isGeneralInquiry && !isChildInquiry && !isComplaint && !isFamilySupportConsultation ) {
		// store a reference to the entry that caused the error
		importErrors.push( { id: inquiry.cll_id, error: `unexpected inquiry type ${ inquiry.inquiry_type }` } );
	}

	if( !isFamilyInquiry && !isSocialWorkerInquiry ) {
		// store a reference to the entry that caused the error
		importErrors.push( { id: inquiry.cll_id, error: `no valid inquirer` } );
	}
	// sanity check to see if the inquiry already exists in the system
	const existingInquiryLoaded = utilityModelFetch.getInquiryById( inquiry.cll_id );
	// fetch the admin who created the inquiry
	const adminLoaded = utilityModelFetch.getAdminById( inquiry.taken_by );
	// fetch the social worker responsible for the inquiry
	const socialWorkerLoaded = utilityModelFetch.getSocialWorkerById( inquiry.agc_id );
	// fetch the child's social workerat the time of the inquiry
	const childsSocialWorkerLoaded = utilityModelFetch.getSocialWorkerById( inquiry.recruitment_agc_id );
	// fetch the family
	const familyLoaded = utilityModelFetch.getFamilyByRegistrationNumber( inquiry.fam_id );
	// fetch the recruitment source
	const sourceLoaded = utilityModelFetch.getSourceById( inquiry.rcs_id );

	existingInquiryLoaded
		// if the inquiry was already saved in the new system
		.then( err => {
			// fire off the next iteration of our generator after pausing for a second
			if( pauseUntilSaved ) {
				setTimeout( () => {
					inquiryGenerator.next();
				}, 1000 );
			}
		})
		// if the inquiry was not already saved in the new system
		.catch( () => {
			Promise.all( [ adminLoaded, websiteBotLoaded, socialWorkerLoaded, childsSocialWorkerLoaded, familyLoaded, sourceLoaded ] )
			.then( values => {
				// store the retrieved admin social worker, and family in local variables
				const [ admin, websiteBot, socialWorker, childsSocialWorker, family, source ] = values;

				let newInquiry = new Inquiry.model({

					takenBy: admin ? admin.get( '_id' ) : websiteBot.get( '_id' ),
					takenOn: new Date( inquiry.call_date ),

					inquirer: isFamilyInquiry ? 'family' :
							isSocialWorkerInquiry ? 'social worker' :
							undefined,

					inquiryType: isChildInquiry ? 'child inquiry'
							: isGeneralInquiry ? 'general inquiry'
							: isComplaint ? 'complaint'
							: isFamilySupportConsultation ? 'family support consultation'
							: 'general inquiry',

					inquiryMethod: inquiryMethodsMap[ inquiry.inquiry_method ] || inquiryMethodsMap[ 'W' ],

					childsSocialWorker: childsSocialWorker ? childsSocialWorker.get( '_id' ) : undefined,

					source: source ? source.get( '_id' ) : undefined,
					
					family: isFamilyInquiry ? family.get( '_id' ) : undefined,
					socialWorker: isSocialWorkerInquiry ? socialWorker.get( '_id' ) : undefined,
					onBehalfOfMAREFamily: false,
					onBehalfOfFamilyText: isOnBehalfOfFamily ? inquiry.family.trim() : undefined,

					inquiryAccepted: true,

					thankYouSentToFamilyOnBehalfOfInquirer: isSocialWorkerInquiry && isOnBehalfOfFamily, // social worker inquiry, on behalf of family
					approvalEmailSentToInquirer: true, // no deps
					approvalEmailSentToFamilyOnBehalfOfInquirer: isSocialWorkerInquiry && isOnBehalfOfFamily, // social worker inquiry, on behalf of family
					emailSentToChildsSocialWorker: ( isChildInquiry || isComplaint ), // child inquiry, isComplaint, or family support consultation.  We only capture child inquiries
					emailSentToAgencies: isGeneralInquiry, // general inquiry

					oldId: inquiry.cll_id

				});

				newInquiry.save( ( err, savedModel ) => {
					// if we run into an error
					if( err ) {
						// store a reference to the entry that caused the error
						importErrors.push( { id: inquiry.cll_id, error: err } );
					}

					// fire off the next iteration of our generator after pausing for a second
					if( pauseUntilSaved ) {
						setTimeout( () => {
							inquiryGenerator.next();
						}, 1000 );
					}
				});
			})
			.catch( err => {
				// we can assume it was a reject from trying to fetch the city or town by an unrecognized name
				importErrors.push( { id: inquiry.cll_id, error: `error importing inquiry - ${ err }` } );

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