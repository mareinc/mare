const listService = require( '../../components/lists/list.controllers' );
const staffEmailContactMiddleware = require( '../../components/staff email contacts/staff-email-contact.controllers' );
const haveAQuestionEmailService = require( '../../components/questions/have-a-question.email.controllers' );

exports.submitQuestion = function submitQuestion( req, res, next ) {
	// store the question information in a local variable
	const question = req.body;
	// reload the form to display the flash message
	const redirectPath = '/forms/have-a-question';
	// set default information for a staff email contact in case the real contact info can't be fetched
	let staffEmailContactInfo = {
		name: { full: 'MARE' },
		email: 'web@mareinc.org'
	};

	// fetch the email target model matching 'have a question'
	const fetchEmailTarget = listService.getEmailTargetByName( 'have a question' );

	fetchEmailTarget
		// fetch contact info for the staff contact for 'have a question'
		.then( emailTarget => staffEmailContactMiddleware.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
		// overwrite the default contact details with the returned object
		.then( staffEmailContact => staffEmailContactInfo = staffEmailContact.staffEmailContact )
		// log any errors fetching the staff email contact
		.catch( err => console.error( `error fetching email contact for have a question submission, default contact info will be used instead`, err ) )
		// send a notification email to MARE staff
		.then( () => haveAQuestionEmailService.sendNewQuestionNotificationEmailToMARE( question, staffEmailContactInfo ) )		
		// if the email was successfully sent to MARE staff
		.then( () => {
			// create a flash message to notify the user of the success
			req.flash( 'success', {
				title: `Your question has been received.`,
				detail: `You should expect a response from MARE within 2 business days.` } );
		})
		// if there was an error sending the email to MARE staff
		.catch( err => {
			// log the error for debugging purposes
			console.error( `error sending new question email to MARE staff`, err );
			// create a flash message to notify the user of the error
			req.flash( 'error', {
				title: `There was an error submitting your question`,
				detail: `If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>` } );
		})
		// redirect the user once finished
		.then( () => {
			// reload the form to display the flash message
			res.redirect( 303, redirectPath );
		});
};