/* this file is used for processing all forms except registration in the system */
// TODO: event submission is currently handled in the events middleware, we might want to migrate that here
const keystone						= require( 'keystone' ),
	  inquiryService				= require( './service_inquiry' ),
	  inquiryEmailService			= require( './emails_inquiry' ),
	  emailTargetMiddleware			= require( './service_email-target' ),
	  staffEmailContactMiddleware	= require( './service_staff-email-contact' );

exports.submitInformationRequest = function submitInformationRequest( req, res, next ) {
	// store the inquiry information in a local variable
	const inquiry = req.body;
	// reload the form to display the flash message
	const redirectPath = '/forms/information-request-form';
	// if the inquirer is and admin user, prevent processing and inform them that admin can't create inquiries
	if( req.user && req.user.userType === 'admin' ) {
		
		req.flash( 'error', {
			title: `Administrators can't create inquiries`,
			detail: `you must be an anonymouse user, site visitor, social worker, or family`
		});

		return res.redirect( 303, redirectPath );
	}

	const inquiryContactTarget = inquiry.interest === 'general info' ? 'general inquiries' : 'non-general inquiries';
	// fetch contact info for the staff contact for site visitor registration
	const fetchRegistrationStaffContactInfo = exports.getRegistrationStaffContactInfo( inquiryContactTarget );

	// TODO: fill in the email submissions for have a question form when handling the email system tasks
	
	// if the user is not logged in
	if( !req.user ) {

		fetchRegistrationStaffContactInfo
			.then( staffContact => {
				// we won't have the required information to generate an inquiry, email MARE with the details instead
				return inquiryEmailService.sendAnonymousInquiryCreatedEmailToMARE( req.body );
			})
			.catch( err => {
				console.error( `error sending anonymous inquiry created email to MARE contact for ${ inquiryContactTarget } - ${ err }` );
			})
			// execute the following regardless of whether the promises were resolved or rejected
			// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
			.then( () => {
				// create an informational message until the email system is built out
				req.flash( 'info', {
					title: 'Emails will be sent once that portion of the system is built out'
				});
				// create an informational message until the email system is built out
				req.flash( 'info', {
					title: 'Creating general inquiries as an anonymouse user still needs to be built',
					detail: 'This feature should be available soon'
				});
				// redirect to the appropriate page 
				res.redirect( 303, redirectPath );
			});
	// otherwise, if the user is logged in
	} else {
		// use the inquiry service to generate a new inquiry record
		inquiryService.createInquiry( { inquiry: req.body, user: req.user } )
			// if it was successful
			.then( () => {
				// create an informational message until the email system is built out
				req.flash( 'info', {
					title: 'Emails will be sent once that portion of the system is built out'
				});
				// create a flash message to notify the user of the success
				req.flash( 'success', {
					title: 'Your inquiry has been processed',
					detail: 'MARE staff should send you a response in 3 to 5 business days'
				});
			})
			// if an error occurred
			.catch( () => {
				// create a flash message to notify the user of the error
				req.flash( 'error', {
					title: 'There was an error processing your request.',
					detail: 'If this error persists, please notify MARE'
				});
			})
			// execute the following regardless of whether the promises were resolved or rejected
			// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
			.then( () => {
				// redirect to the appropriate page 
				res.redirect( 303, redirectPath );
			});
	}
};

exports.submitQuestion = function submitQuestion( req, res, next ) {
	// TODO: fill in the email submissions for have a question form when handling the email system tasks
	req.flash( 'info', {
		title: 'Emails will be sent once that portion of the system is built out'
	});

	// reload the form to display the flash message
	res.redirect( '/forms/have-a-question-form' );
};

// TODO: this is a duplicate of functionality in the registration middleware, can we combine them to make the code more DRY
/* returns an array of staff email contacts */
exports.getRegistrationStaffContactInfo = emailTarget => {
	
		return new Promise( ( resolve, reject ) => {
			// if the user type was unrecognized, the email target can't be set
			if( !emailTarget ) {
				// reject the promise with details of the issue
				return reject( `error fetching staff contact - unknown email target ${ emailTarget }` );
			}
			// TODO: it was nearly impossible to create a readable comma separated list of links in the template with more than one address,
			// 	     so we're only fetching one contact when we should fetch them all
			// get the database id of the admin contact set to handle registration questions for the target user type
			emailTargetMiddleware.getTargetId( emailTarget )
				.then( targetId => {
					// get the contact details of the admin contact set to thandle registration questions for the target user type
					return staffEmailContactMiddleware.getContactById( targetId );
				})
				.then( contactInfo => {
					// resolve the promise with the full name and email address of the contact
					resolve( contactInfo );
				})
				.catch( err => {
					// reject the promise with the reason for the rejection
					reject( `error fetching staff contact - ${ err }` );
				});
		});
	}