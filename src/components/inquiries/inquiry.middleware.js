const inquiryService = require( '../../components/inquiries/inquiry.controllers' );

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
				detail: `A MARE staff person will be in touch with additional information within 2-3 business days.` } );
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

exports.saveInquiryNote = function saveInquiryNote( req, res, next ) {

    // extract request data
    const { id: inquiryId, notes } = req.body;

    inquiryService.saveInquiryNote( inquiryId, notes )
        .catch( error => console.error( error ) )
        .finally( () => res.send() );
};
