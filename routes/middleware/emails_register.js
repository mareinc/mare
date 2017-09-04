const keystone				= require( 'keystone' );
const utilitiesMiddleware   = require( './utilities' );

exports.sendRegistrationConfirmationEmailToStaff = ( user, registrationStaffContact, done ) => {
	// do nothing if sending of the email is not currently allowed
	if( process.env.MIGRATION === 'true' ) {
		return done();
	}
	// find the email template in templates/emails/
	new keystone.Email({
		templateExt		: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'register_staff-notification'
	}).send({
		to: registrationStaffContact,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject		: `new ${ user.userType } registration`,
		inquiry		: inquiry,
		inquiryData	: inquiryData
	// TODO: we should be handling success/failure better, possibly with a flash message if we can make it appear in the model screen
	}, ( err, message ) => {
		// log any errors
		if( err ) {
			console.log( `error sending staff email: ${ err }` );
			return done();
		}
		// the response object is stored as the 0th element of the returned message
		const response = message ? message[ 0 ] : undefined;
		// if the email failed to send, or an error occurred ( which is does, rarely ) causing the response message to be empty
		if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
			console.log( `staff notification email failed to send: ${ message }` );
			console.log( `error: ${ err }` );
			return done();
		}

		console.log( `staff notification email sent successfully` );

		done();
	});

};

exports.sendThankYouEmailToUser = ( staffContactName, staffContactEmail, userEmail, userType, verificationCode, host ) => {
	
	return new Promise( ( resolve, reject ) => {
		// TODO: check the logic around process.env.migration, it doesn't seem to make sense
		// if sending of the email is not currently allowed
		if( process.env.MIGRATION === 'true' || process.env.SEND_REGISTRATION_THANK_YOU_EMAILS === 'false' ) {
			// resolve the promise before any further processing takes place
			return reject( `sending of registration thank you emails is currently turned off, no email was sent to ${ userEmail }` );
		}
		// find the email template in templates/emails/
		new keystone.Email({

			templateExt 	: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'register_thank-you-to-user'

		}).send({

			to: 'jared.j.collier@gmail.com',
			from: {
				name 	: 'MARE',
				email 	: 'admin@adoptions.io'
			},
			subject       		: 'thank you for registering',
			isSiteVisitor 		: userType === 'site visitor',
			isSocialWorker		: userType === 'social worker',
			isFamily      		: userType === 'family',
			emailSubject		: `${ userType } registration question`,
			staffContactEmail,
			staffContactName,
			host,
			userType,
			verificationCode

		}, ( err, message ) => {
			// log any errors
			if( err ) {
				return reject( `error sending registration thank you email: ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `thank you to new registered user email failed to send: ${ message }.  Error: ${ err }` );
			}

			resolve();
		});
	});
};