const keystone = require( 'keystone' );
const ObjectId = require( 'mongodb' ).ObjectId;
const errorUtils = require( '../../utils/errors.controllers' );
const childService = require( '../children/child.controllers' );
const inquiryService = require( '../../components/inquiries/inquiry.controllers' );
const cscRegionContactService = require( '../csc region contacts/csc-region-contact.controllers' );
const inquiryEmailService = require( './inquiry.email.controllers' );
const listService = require( '../lists/list.controllers' );
const staffEmailService = require( '../staff email contacts/staff-email-contact.controllers' );

exports.submitInquiry = function submitInquiry( req, res, next ) {
	// reload the form to display the flash message
	const redirectPath = '/forms/information-request';
	// if the inquirer is and admin user, prevent processing and inform them that admin can't create inquiries
	if( req.user && req.user.userType === 'admin' ) {
		
		req.flash( 'error', {
			title: `Administrators can't create inquiries.`,
			detail: `To submit an inquiry on behalf of a family, social worker or site visitor, enter it through the database.`
		});

		return res.redirect( 303, redirectPath );
	}
	// use the inquiry service to generate a new inquiry record
	const inquiryCreated = inquiryService.createInquiry( { inquiry: req.body, user: req.user } )
	// if it was successful
	inquiryCreated
		.then( inquiry => {
			// create a flash message to notify the user of the success
			req.flash( 'success', {
				title: `Your inquiry has been received.`,
				detail: `A MARE staff person will be in touch with additional information within 2-3 business days.
				You can see a history of inquiries submitted on the <a href="/account#inquiries">My Inquiries</a> page.` } );
		})
		// if an error occurred
		.catch( err => {
			// log the error for debugging purposes
			console.error( `inquiry could not be created through the information request form`, err );
			// create a flash message to notify the user of the error
			req.flash( 'error', {
				title: `There was an error processing your request.`,
				detail: `If this error persists, please notify MARE at <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>` } );
		})
		// execute the following regardless of whether the promises were resolved or rejected
		// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
		.then( () => {
			// redirect to the appropriate page 
			res.redirect( 303, redirectPath );
		});
};

// save an inquiry that was submitted on HubSpot.  this will be called via webhook after the submission has been captured in HubSpot
exports.submitHubSpotInquiry = async function submitHubSpotInquiry( req, res, next ) {

	// placeholder for error data
	let errorData;

	try {

		// log inquiry request data (to help with debugging, we should eventually be able to remove this log statement)
		console.log( 'Processing HubSpot Inquiry:', req.body );

		// destructure inquiry data
		const {
			email,
			inquiry,
			recordURL,
			registrationNumbers
		} = req.body;

		// ensure the inquirer has a Keystone account
		if ( !recordURL ) {
			errorData = errorUtils.ERRORS.INQUIRY.MISSING_RECORD_URL;
			throw new Error( 'Cannot save Inquiry, Inquirer does not have a Keystone record.' );
		}

		// determine inquirer type
		let inquirerModelType;
		try {

			// get the model slug from the Keystone record URL
			const inquirerModelSlug = recordURL.split( '/keystone/' )[ 1 ].split( '/' )[ 0 ];
			switch( inquirerModelSlug ) {
				case 'families':
					inquirerModelType = 'Family';
					break;
				case 'social-workers':
					inquirerModelType = 'Social Worker';
					break;
				default:
					// if user is neither a family nor social worker, throw an error for invalid user type
					throw new Error( `Invalid inquirer model slug: ${inquirerModelSlug}` );
			}
		} catch( error ) {
			// set error data
			errorData = errorUtils.ERRORS.INQUIRY.BAD_RECORD_TYPE;
			// throw error again to skip further execution and jump to outer catch block
			throw error;
		}

		// determine inquirer id
		let inquirerId;
		try {

			// get inquirer's record ID
			// recordURL structure: ...domain/keystone/type/id
			inquirerId = recordURL.split( '/' ).pop();

			// ensure inquirer ID is a valid ObjectId
			if ( !ObjectId.isValid( inquirerId ) ) {
				throw new Error( `Cannot save Inquiry, Inquirer does not have a valid Keystone Record ID.` );
			}
		} catch( error ) {

			// set error data
			errorData = errorUtils.ERRORS.INQUIRY.BAD_RECORD_ID;
			// throw error again to skip further execution and jump to outer catch block
			throw error;
		}

		// get the inquirer's Keystone record
		let inquirerRecord;
		try {

			// request the inquirer's record
			inquirerRecord = await keystone.list( inquirerModelType ).model.findById( inquirerId ).exec();

			// check to ensure a record was retrieved and is a valid
			if ( !inquirerRecord || !inquirerRecord._id ) {
				throw new Error( `Cannot save Inquiry, no Keystone Record exists with ID: ${inquirerId}.` );
			}

		} catch( error ) {
			// set error data
			errorData = errorUtils.ERRORS.INQUIRY.MISSING_RECORD;
			// throw error again to skip further execution and jump to outer catch block
			throw error;
		}

		// save the inquiry
		let inquiryRecord;
		try {

			// compose arguments for inquiry creation
			const inquiryBody = {
				childRegistrationNumbers: registrationNumbers,
				inquiry,
				interest: 'child info',
				source: ''
			};

			// save the inquiry
			inquiryRecord = await inquiryService.saveChildInquiry({ inquiry: inquiryBody, user: inquirerRecord });

			if ( !inquiryRecord ) {
				throw new Error( 'Failed to save new Inquiry.' );
			}

			// set HubSpot metadata
			inquiryRecord.isHubSpotInquiry = true;
			await inquiryRecord.save();

		} catch( error ) {
			// set error data
			errorData = errorUtils.ERRORS.INQUIRY.INQUIRY_CREATION_FAILED;
			// throw error again to skip further execution and jump to outer catch block
			throw error;
		}
		
		// populate relevant fields on the inquiry model and extract relevant data for email notification
		let relevantInquiryData;
		try {
			relevantInquiryData = await inquiryService.extractInquiryData( inquiryRecord );
		} catch( error ) {
			// set error data
			errorData = errorUtils.ERRORS.INQUIRY.INQUIRY_DATA_AGGREGATION_FAILED;
			// throw error again to skip further execution and jump to outer catch block
			throw error;
		}

		// populate relevant fields on the inquirer model and extract relevant data for email notification
		let relevantInquirerData;
		try {
			relevantInquirerData = await inquiryService.extractInquirerData( inquirerRecord );
		} catch( error ) {
			// set error data
			errorData = errorUtils.ERRORS.INQUIRY.INQUIRER_DATA_AGGREGATION_FAILED;
			// throw error again to skip further execution and jump to outer catch block
			throw error;
		}

		// get the target recipient for the notification email
		const fallbackEmailTarget = 'noahweinert+fallback@gmail.com';
		let notificationEmailTarget, targetRegion;
		try {

			// use the first child on the inquiry to find the target region (all children should be sibs and from the same region)
			const child = inquiryRecord.children[ 0 ];
			// if we have the recruitment worker region, we'll use it to find the staff region contact, otherwise, fall back to the adoption worker region
			targetRegion = child.adoptionWorkerAgencyRegion || child.recruitmentWorkerAgencyRegion;

			// get the CSC Regional Contact (primary target recipient)
			try {

				const regionContactRecord = await cscRegionContactService.getCSCRegionContactByRegion( { region: targetRegion, fieldsToPopulate: [ 'cscRegionContact' ] } );
				notificationEmailTarget = regionContactRecord.cscRegionContact.email;

			} catch ( error ) {
				console.error( error );
			}

			// if no CSC Regional Contact found, attempt to get fallback
			if ( !notificationEmailTarget ) {

				console.log( 'Could not find a CSC Regional Contact, falling back to internal MARE contact...' );
				
				// get the Staff Email Contact (secondary target recipient)
				try {

					const staffTarget = await listService.getEmailTargetByName( 'child inquiry' );
					const staffContactRecord = await staffEmailService.getStaffEmailContactByEmailTarget( staffTarget.get( '_id' ), [ 'staffEmailContact' ] );
					notificationEmailTarget = staffContactRecord.staffEmailContact.email;

				} catch ( error ) {
					console.error( error );
					// throw this error to enter outer catch block and fall back to hard-coded contact
					throw error;
				}
			}
		} catch( error ) {
			// set error data
			errorData = errorUtils.ERRORS.INQUIRY.NOTIFICATION_EMAIL_TARGET_NOT_FOUND;
			// log the error and send an error response to the webhook
			errorUtils.logCodedError(
				errorData.code,
				errorData.message
			);

			// we do not need to throw here, as we can recover from any errors in this block by using the hard-coded fallback
			console.log( 'Could not find a CSC Regional Contact or Staff Email Contact, falling back to hard-coded contact...' );
			notificationEmailTarget = fallbackEmailTarget;
		}

		// send the notification email to the target recipient
		try {
			await inquiryEmailService.sendNewInquiryEmailToMARE( { inquiryData: relevantInquiryData, inquirerData: relevantInquirerData, staffEmail: notificationEmailTarget } );
		} catch( error ) {
			// set error data
			errorData = errorUtils.ERRORS.INQUIRY.NOTIFICATION_EMAIL_SEND_FAILED;
			// throw error again to skip further execution and jump to outer catch block
			throw error;
		}

		// send a success response to the webhook
		res.sendStatus( 200 );
		
		// set success data
		successData = errorUtils.ERRORS.INQUIRY.SUCCESS;
		// log the success
		errorUtils.logCodedError(
			successData.code,
			successData.message
		);
	} catch ( error ) {

		// log the error and send an error response to the webhook
		errorUtils.logCodedError(
			errorData.code,
			errorData.message
		);
		console.error( error );
		res.sendStatus( 500 );

		// send an email for any inquiry processing failures
		try {
			
			// get the staff email contact for HubSpot inquiry processing failures
			const staffEmailContact = await staffEmailService.getStaffEmailContactByEmailTargetName( 'HubSpot inquiry processing failure', [ 'staffEmailContact' ], 'jeremys@mareinc.org' );
			// send notification email to MARE contact
			inquiryEmailService.sendHubSpotInquiryProcessingFailedToMARE( staffEmailContact, req.body, function() {});

		} catch ( error ) {

			// set error data
			errorData = errorUtils.ERRORS.INQUIRY.ERROR_NOTIFICATION_EMAIL_SEND_FAILED;
			// log the error and send an error response to the webhook
			errorUtils.logCodedError(
				errorData.code,
				errorData.message
			);
			console.error( error );
		}
	}
};

exports.saveInquiryNote = function saveInquiryNote( req, res, next ) {

    // extract request data
    const { id: inquiryId, notes } = req.body;

    inquiryService.saveInquiryNote( inquiryId, notes )
        .catch( error => console.error( error ) )
        .finally( () => res.send() );
};

// ensure a user lives in-state (or in New England) before allowing them to submit an inquiry
exports.requireInStateFamily = function requireInStateFamily( req, res, next ) {

	// if the user is not logged in, or is not a family, allow them through to the existing inquiry page flow
	if ( !req.user || req.user.userType !== 'family' ) {

		next();

	// if the user is logged in, check to see if they live in a state that allows them to submit an inquiry	
	} else {
		
		const ALLOWED_STATE_ABBREVIATIONS = [ 'NH', 'NY', 'ME', 'VT', 'MA', 'CT', 'RI' ];
		const OUT_OF_STATE_INQUIRY_PAGE_PATH = '/page/out-of-state-inquiries';
		
		listService.getAllStates()
			.then( stateDocs => {

				// determine if the user is in an allowed state
				const allowedStates = stateDocs.filter( state => ALLOWED_STATE_ABBREVIATIONS.includes( state.abbreviation ) );
				const userState = req.user.address.state.toString();
				const isUserInAllowedState = allowedStates.find( allowedState => allowedState._id.toString() === userState );
				
				// if the user is in an allowed state
				if ( isUserInAllowedState ) {
					
					// continue execution and allow them to view the inquiry page
					next();
				
				// if the user is not in an allowed state
				} else {

					// redirect them to the out of state inquiry page
					res.redirect( 302, OUT_OF_STATE_INQUIRY_PAGE_PATH );
				}
			})
			.catch( error => {

				console.log( 'could not verify that family is in a state that allows them to submit an inquiry.' );
				console.error( error );
				res.redirect( 302, OUT_OF_STATE_INQUIRY_PAGE_PATH );
			});
	}
};
