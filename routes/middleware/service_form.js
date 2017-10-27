/* this file is used for processing all forms except registration in the system */
// TODO: event submission is currently handled in the events middleware, we might want to migrate that here
const keystone				= require( 'keystone' ),
	  inquiryService		= require( './service_inquiry' ),
	  inquiryEmailService	= require( './emails_inquiry' );

exports.submitInformationRequest = function submitInformationRequest( req, res, next ) {
	// reload the form to display the flash message
	const redirectPath = '/forms/information-request-form';
	// if the inquirer is and admin user, prevent processing and inform them that admin can't create inquiries
	if( req.user.userType === 'admin' ) {
		req.flash( 'error', { title: `Administrators can't create inquiries, in order to create an inquiry, you must be an anonymouse user, site visitor, social worker, or family` } );
		return res.redirect( 303, redirectPath );
	}

	// TODO: fill in the email submissions for have a question form when handling the email system tasks
	
	// if the user is not logged in
	if( !req.user ) {
		// we won't have the required information to generate an inquiry, email MARE with the details instead
		inquiryEmailService.sendAnonymousInquiryCreatedEmail( req.body );
	// otherwise, if the user is logged in
	} else {
		// use the inquiry service to generate a new inquiry record
		inquiryService.createInquiry( { inquiry: req.body, user: req.user } )
			// if it was successful
			.then( () => {
				// create an informational message until the email system is built out
				req.flash( 'info', { title: 'Emails will be sent once that portion of the system is built out' } );
				// create a flash message to notify the user of the success
				req.flash( 'success',  { title: 'Your inquiry has been processed',
										details: 'MARE staff should send you a response in 3 to 5 business days' } );
				// redirect to the appropriate page 
				res.redirect( 303, redirectPath );
			})
			// if an error occurred
			.catch( () => {
				// create a flash message to notify the user of the error
				req.flash( 'error', { title: 'There was an error processing your request.',
									  details: 'If this error persists, please notify MARE' } );
				// redirect to the appropriate page 
				res.redirect( 303, redirectPath );
			});
	}
};

exports.submitQuestion = function submitQuestion( req, res, next ) {
	// TODO: fill in the email submissions for have a question form when handling the email system tasks
	req.flash( 'info', { title: 'Emails will be sent once that portion of the system is built out' } );
	// reload the form to display the flash message
	res.redirect( '/forms/have-a-question-form' );
};