const keystone				= require( 'keystone' ),
	  utilitiesMiddleware   = require( './utilities' );

exports.sendNewQuestionNotificationEmailToMARE = ( question, staffEmailContact ) => {

	return new Promise( ( resolve, reject ) => {

		const staffEmail = staffEmailContact.staffEmailContact.get( 'email' );
		
		// if sending of the email is not currently allowed
		if( process.env.SEND_QUESTION_RECEIVED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		if( !staffEmail ) {
			return reject( `no staff contact was provided` );
		}

		// the email template can be found in templates/emails/
		new keystone.Email({
			templateExt		: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'have-a-question-notification-to-mare'
		}).send({
			to				: staffEmail,
			from: {
				name 	: 'MARE',
				email 	: 'admin@adoptions.io'
			},
			subject		: `new question`,
			question

		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending new question notification email to MARE - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending new question notification email to MARE - ${ err }` );
			}

			resolve();
		});
	});
};
