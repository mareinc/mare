const keystone = require( 'keystone' );
const inquiryService = require( '../../components/inquiries/inquiry.controllers' );
const listService = require( '../lists/list.controllers' );

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

	console.log( 'Processing child inquiry webhook...' );
	console.log( req.body );

	// destructure inquiry data
	const {
		email,
		inquiry,
		recordURL,
		registrationNumbers
	} = req.body;

	// determine inquirer type
	const inquirerModelType = recordURL.includes( 'families' ) ? 'Family' : 'Social Worker';
	// get inquirer's record ID
	// recordURL structure: ...domain/keystone/type/id
	const inquirerId = recordURL.split( '/' ).pop();

	const inquirerRecord = await keystone.list( inquirerModelType ).model.findById( inquirerId ).exec();
	const inquiryBody = {
		childRegistrationNumbers: registrationNumbers,
		inquiry,
		interest: 'child info',
		source: ''
	};
	
	await inquiryService.createInquiry( { inquiry: inquiryBody, user: inquirerRecord } );

	// send a response to the webhook
	res.sendStatus(200);
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
