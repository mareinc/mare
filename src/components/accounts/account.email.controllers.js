const Email = require( 'keystone-email' ),
      hbs = require( 'hbs' );

exports.sendPasswordResetEmail = ( name, email, host, resetToken ) => {
    // TODO: there is no way to turn these emails off
    return new Promise( ( resolve,reject ) => {
        // if sending of the email is not currently allowed
		if( process.env.SEND_FORGOT_PASSWORD_EMAILS_TO_USER !== 'true' ) {
			// reject the promise with information about why
			return reject( new Error( `password reset email to users is disabled` ) );
        }
        
        // find the email template in templates/emails/
		Email.send(
            // template path
            'login_reset-password',
            // email options
            {
                engine: 'hbs',
                transport: 'mandrill',
                root: 'src/templates/emails/'
            // render options
            }, {
                name,
                host,
                resetToken,
                layout: false
            // send options
            }, {
                apiKey: process.env.MANDRILL_APIKEY,
                to: email,
                from: {
                    name: 'MARE',
                    email: 'communications@mareinc.org' // TODO: this should be in a model or ENV variable
                },
                subject: 'Password Reset',
            // callback
            }, ( err, message ) => {

                if( err ) {
                    // log the error for debugging purposes
                    console.error( `error sending password reset email`, err );

                    return reject();
                }
                // the response object is stored as the 0th element of the returned message
                const response = message ? message[ 0 ] : undefined;
                // if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
                if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
                    // log the error for debugging purposes
                    console.error( `error sending password reset email - ${ message }`, err );

                    return reject();
                }

                resolve();
            });
    });
};

exports.sendAccountVerificationEmailToUser = ( userEmail, userType, verificationCode, host ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_ACCOUNT_VERIFICATION_EMAILS_TO_USER !== 'true' ) {
			// reject the promise with information about why
			return reject( new Error( `sending of the email is disabled` ) );
		}

		if( !userEmail ) {
			return reject( new Error( `no user email was provided` ) );
		}

		// find the email template in templates/emails/
		Email.send(
			// template path
            'register_account-verification-to-user',
            // email options
            {
                engine: 'hbs',
                transport: 'mandrill',
                root: 'src/templates/emails/'
            // render options
            }, {
                host,
				userType,
				verificationCode,
                layout: false
            // send options
            }, {
                apiKey: process.env.MANDRILL_APIKEY,
                to: userEmail,
				from: {
					name: 'MARE',
					email: 'communications@mareinc.org' // TODO: this should be in a model or ENV variable
				},
				subject: 'please verify your MARE account'
			// callback
			}, ( err, message ) => {
				// if there was an error sending the email
				if( err ) {
					// reject the promise with details
					return reject( new Error( `error sending account verification email to newly registered user` ) );
				}
				// the response object is stored as the 0th element of the returned message
				const response = message ? message[ 0 ] : undefined;
				// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
				if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
					// reject the promise with details
					return reject( new Error( `error sending account verification email to newly registered user - ${ response.status } - ${ response.email } - ${ response.reject_reason }` ) );
				}

				resolve();
			});
	});
};