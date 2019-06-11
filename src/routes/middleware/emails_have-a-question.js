const Email = require( 'keystone-email' ),
      hbs = require( 'hbs' );

exports.sendNewQuestionNotificationEmailToMARE = ( question, staffEmailContact ) => {

	return new Promise( ( resolve, reject ) => {

		const staffEmail = staffEmailContact.email;

		// if sending of the email is not currently allowed
		if ( process.env.SEND_QUESTION_RECEIVED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( new Error( `sending of the email is disabled` ) );
		}

		if ( !staffEmail ) {
			return reject( new Error( `no staff contact was provided` ) );
		}

		// the email template can be found in templates/emails/
		Email.send(
			// template path
			'have-a-question-notification-to-mare',
			// email options
            {
                engine: 'hbs',
                transport: 'mandrill',
                root: 'templates/emails/'
            // render options
            }, {
                question,
                layout: false
            // send options
            }, {
                apiKey: process.env.MANDRILL_APIKEY,
                to: staffEmail,
                from: {
                    name: 'MARE',
                    email: 'communications@mareinc.org' // TODO: this should be in a model or ENV variable
                },
                subject: 'New Question',
			// callback
			}, (err, message) => {
				// if there was an error sending the email
				if (err) {
					// reject the promise with details
					return reject( new Error( `error sending new question notification email to MARE` ) );
				}
				// the response object is stored as the 0th element of the returned message
				const response = message ? message[ 0 ] : undefined;
				// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
				if (response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
					// reject the promise with details
					return reject( new Error( `error sending new question notification email to MARE - ${ response.status } - ${ response.email } - ${ response.reject_reason }` ) );
				}

				resolve();
			});
	});
};
