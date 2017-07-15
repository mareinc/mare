/* This file is used for processing all forms except registration in the system */
// TODO: event submission is currently handled in the events middleware, we might want to migrate that here
const keystone	= require('keystone');

exports.submitInformationRequest = function submitInformationRequest( req, res, next ) {
	// TODO: fill in the email submissions for have a question form when handling the email system tasks
	req.flash( 'info', { title: 'Emails will be sent once that portion of the system is built out' } );
		// reload the form to display the flash message
		res.redirect( '/forms/information-request-form' );
};

exports.submitQuestion = function submitQuestion( req, res, next ) {
	// TODO: fill in the email submissions for have a question form when handling the email system tasks
	req.flash( 'info', { title: 'Emails will be sent once that portion of the system is built out' } );
		// reload the form to display the flash message
		res.redirect( '/forms/have-a-question-form' );
};