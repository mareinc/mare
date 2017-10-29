const keystone					= require( 'keystone' );
const Inquiry 					= keystone.list( 'Inquiry' );
// utility middleware
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all mailing lists.  This is created here to be available to multiple functions below
let mailingListAttendees;
// create references to the map we stored on locals.  This is bound here to be available to multiple functions below since res can't be passed to the generator
let mailingListsMap;
// expose done to be available to all functions below
let mailingListAttendeeImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importMailingListAttendees = ( req, res, done ) => {
	// expose the map we'll need for this import
	mailingListsMap = res.locals.migration.maps.mailingListsMap;
	// expose done to our generator
	mailingListAttendeeImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the mailing list attendees CSV file to JSON
	const mailingListAttendeesLoaded = CSVConversionMiddleware.fetchMailingListAttendees();

	// if the file was successfully converted, it will return the array of mailing list attendees
	mailingListAttendeesLoaded.then( mailingListAttendeesArray => {
		// store the mailing list attendees in a variable accessible throughout this file
		mailingListAttendees = mailingListAttendeesArray;
		// call the function to build the sibling map
		exports.buildMailingListAttendeesMap();
		// kick off the first run of our generator
		mailingListAttendeeGenerator.next();
	// if there was an error converting the mailing list attendees file
	}).catch( reason => {
		console.error( `error processing mailing list attendees` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildMailingListAttendeesMap = () => {
	// load all mailing list attendees
	for( let mailingListAttendee of mailingListAttendees ) {
		// for each mailing list attendee, get the inquiry id
		const mailingListAttendeeId = mailingListAttendee.mlt_id;
	 	// and use the id as a key, and add each mailing list attendee's _id in a key object
		if( mailingListAttendeeId ) {




			// TODO: need to add a subloop here to differentiate groups of families, children, and social workers



			
			if( newMailingListAttendeesMap[ mailingListAttendeeId ] ) {

				newMailingListAttendeesMap[ mailingListAttendeeId ].add( mailingListAttendee.agn_id );

			} else {

				let newMailingListAttendeeSet = new Set( [ mailingListAttendee.agn_id ] );
				// create an entry containing a set with the one inquiry child
				newMailingListAttendeesMap[ mailingListAttendeeId ] = newMailingListAttendeeSet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateMailingListAttendees = function* generateMailingListAttendees() {

	console.log( `creating mailing list attendees in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords		= mailingListAttendees.length,
		remainingRecords 	= totalRecords,
		batchCount			= 200, // number of records to be process simultaneously
		inquiryNumber		= 0; // keeps track of the current inquiry number being processed.  Used for batch processing
	// loop through each inquiry object we need to create a record for
	for( let inquiry of mailingListAttendees ) {
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

	// create a promise for fetching the admin who created the inquiry
	const adminLoaded = utilityModelFetch.getAdminById( inquiry.taken_by );
	// fetch the social worker
	const socialWorkerLoaded = utilityModelFetch.getSocialWorkerById( inquiry.agc_id );
	// fetch the family
	const familyLoaded = utilityModelFetch.getFamilyByRegistrationNumber( inquiry.fam_id );
	// create a promise
	const sourceLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the recruitment source
		utilityModelFetch.getSourceById( resolve, reject, inquiry.rcs_id );
	});

	Promise.all( [ adminLoaded, socialWorkerLoaded, familyLoaded, sourceLoaded ] ).then( values => {
		// store the retrieved admin social worker, and family in local variables
		const [ admin, socialWorker, family, source ] = values;


// TODO: LEFT OFF AT LEAST HERE BUT CHECK THE WHOLE FILE


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
const mailingListAttendeeGenerator = exports.generateMailingListAttendees();