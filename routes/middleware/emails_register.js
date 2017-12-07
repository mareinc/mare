const keystone				= require( 'keystone' );
const utilitiesMiddleware   = require( './utilities' );

exports.sendNewSiteVisitorNotificationEmailToMARE = ( user, registrationStaffContact ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_NEW_SITE_VISITOR_REGISTERED_EMAILS_TO_MARE === 'false' ) {
			// reject the promise with information about why
			return reject( `sending of new user notification emails to MARE staff is currently turned off, no email was sent to ${ registrationStaffContact.email }` );
		}

		// const userData = new Map();
		// // store only the fields that have been populated by the user
		// if( user.name.first ) { userData.set( 'first name', user.name.first ); }
		// if( user.name.last ) { userData.set( 'last name', user.name.last ); }
		// if( user.phone.work ) { userData.set( 'work phone', user.phone.work ); }
		// if( user.phone.home ) { userData.set( 'home phone', user.phone.home ); }
		// if( user.phone.mobile ) { userData.set( 'mobile phone', user.phone.mobile ); }
		// if( user.phone.preferred ) { userData.set( 'preferred phone', user.phone.preferred ); }
		// if( user.address.street1 ) { userData.set( 'street 1', user.address.street1 ); }
		// if( user.address.street2 ) { userData.set( 'street 2', user.address.street2 ); }
		// if( user.address.city.city && !user.address.isOutsideMassachusetts ) { userData.set( 'city', user.address.city ); }
		// if( user.address.cityText && user.address.isOutsideMassachusetts ) { userData.set( 'city', user.address.cityText ); }
		// if( user.address.state.state ) { userData.set( 'state', user.address.state ); }
		// if( user.address.zipCode ) { userData.set( 'zip code', user.address.zipCode ); }
		// if( user.heardAboutMAREFrom.length !== 0 ) { userData.set( 'heard about MARE from', user.heardAboutMAREFrom ); }
		// if( user.heardAboutMAREFromOther ) { userData.set( 'heard about MARE from - other', user.heardAboutMAREFromOther ); }

		// find the email template in templates/emails/
		new keystone.Email({
			templateExt		: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'register_new-user-notification-to-staff'
		}).send({
			to				: 'jared.j.collier@gmail.com',
			from: {
				name 		: 'MARE',
				email 		: 'admin@adoptions.io'
			},
			subject			: `new ${ user.userType } registration`,
			userType		: user.userType,
			user,
			registrationStaffContact
		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending new user notification email to MARE: ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `new user notification email to MARE failed to send: ${ message }.  Error: ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendAccountVerificationEmailToUser = ( userEmail, userType, verificationCode, host ) => {
	
	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_ACCOUNT_VERIFICATION_EMAILS_TO_USER === 'false' ) {
			// reject the promise with information about why
			return reject( `sending of account verification emails is currently turned off, no email was sent to ${ userEmail }` );
		}

		// find the email template in templates/emails/
		new keystone.Email({

			templateExt 		: 'hbs',
			templateEngine 		: require( 'handlebars' ),
			templateName 		: 'register_account-verification-to-user'

		}).send({

			to					: 'jared.j.collier@gmail.com',
			from: {
				name 			: 'MARE',
				email 			: 'admin@adoptions.io'
			},
			subject       		: 'please verify your MARE account',
			emailSubject		: `${ userType } registration question`,
			host,
			userType,
			verificationCode

		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending registration account verification email: ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `account verification to newly registered user email failed to send: ${ message }.  Error: ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendThankYouEmailToUser = ( staffContactInfo = { email: 'jared.j.collier@gmail.com', name: 'Jared' } , userEmail, userType, host ) => {
	
	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_REGISTRATION_THANK_YOU_EMAILS === 'false' ) {
			// resolve the promise before any further processing takes place
			return reject( `sending of registration thank you emails is currently turned off, no email was sent to ${ userEmail }` );
		}

		// find the email template in templates/emails/
		new keystone.Email({

			templateExt 		: 'hbs',
			templateEngine 		: require( 'handlebars' ),
			templateName 		: 'register_thank-you-to-user'

		}).send({

			to					: 'jared.j.collier@gmail.com',
			from: {
				name 			: 'MARE',
				email 			: 'admin@adoptions.io'
			},
			subject       		: 'thank you for registering',
			emailSubject		: `${ userType } registration question`,
			staffContactEmail	: staffContactInfo.email,
			staffContactName	: staffContactInfo.name,
			host,
			userType,
			verificationCode

		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending registration thank you email: ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `thank you to newly registered user email failed to send: ${ message }.  Error: ${ err }` );
			}

			resolve();
		});
	});
};