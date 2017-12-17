const keystone				= require( 'keystone' ),
	  utilitiesMiddleware   = require( './utilities' );

exports.sendNewSiteVisitorNotificationEmailToMARE = ( user, userEmail, registrationStaffContact ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_NEW_SITE_VISITOR_REGISTERED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		if( !registrationStaffContact ) {
			return reject( `no staff was contact provided` );
		}

		// an array was used instead of a Map because Mustache templates apparently can't handle maps
		let userData = [];
		let heardAboutMAREFromArray = [];

		for( entry of user.heardAboutMAREFrom ) {
			heardAboutMAREFromArray.push( entry.wayToHearAboutMARE );
		}
		// store only the fields that have been populated by the user
		if( user.name.first ) { userData.push( { key: 'first name', value: user.name.first } ); }
		if( user.name.last ) { userData.push( { key: 'last name', value: user.name.last } ); }
		if( user.email ) { userData.push( { key: 'email', value: user.email } ); }
		if( user.phone.work ) { userData.push( { key: 'work phone', value: user.phone.work } ); }
		if( user.phone.home ) { userData.push( { key: 'home phone', value: user.phone.home } ); }
		if( user.phone.mobile ) { userData.push( { key: 'mobile phone', value: user.phone.mobile } ); }
		if( user.phone.preferred ) { userData.push( { key: 'preferred phone', value: user.phone.preferred } ); }
		if( user.address.street1 ) { userData.push( { key: 'street 1', value: user.address.street1 } ); }
		if( user.address.street2 ) { userData.push( { key: 'street 2', value: user.address.street2 } ); }
		if( !user.address.isOutsideMassachusetts && user.address.city.cityOrTown ) { userData.push( { key: 'city', value: user.address.city.cityOrTown } ); }
		if( user.address.isOutsideMassachusetts && user.address.cityText ) { userData.push( { key: 'city', value: user.address.cityText } ); }
		if( user.address.state.state ) { userData.push( { key: 'state', value: user.address.state.state } ); }
		if( user.address.zipCode ) { userData.push( { key: 'zip code', value: user.address.zipCode } ); }
		if( heardAboutMAREFromArray.length !== 0 ) { userData.push( { key: 'heard about MARE from', value: heardAboutMAREFromArray } ); }
		if( user.heardAboutMAREFromOther ) { userData.push( { key: 'heard about MARE from - other', value: user.heardAboutMAREFromOther } ); }

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
			userData,
			registrationStaffContact
		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending new site visitor notification email to MARE - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending new site visitor notification email to MARE - ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendNewSocialWorkerNotificationEmailToMARE = ( user, userEmail, registrationStaffContact ) => {
	
	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_NEW_SOCIAL_WORKER_REGISTERED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		if( !registrationStaffContact ) {
			return reject( `no staff contact was provided` );
		}
		// an array was used instead of a Map because Mustache templates apparently can't handle maps
		let userData = [];
		let userMailingListData = [];

		// store only the fields that have been populated by the user
		if( user.name.first ) { userData.push( { key: 'first name', value: user.name.first } ); }
		if( user.name.last ) { userData.push( { key: 'last name', value: user.name.last } ); }
		if( user.email ) { userData.push( { key: 'email', value: user.email } ); }
		if( user.position ) { userData.push ( { key: 'position', value: user.position } ); } 
		if( user.title ) { userData.push( { key: 'title', value: user.title } ); }
		if( user.agencyText ) { userData.push( { key: 'agency', value: user.agencyText } ); }
		if( user.phone.work ) { userData.push( { key: 'work phone', value: user.phone.work } ); }
		if( user.phone.mobile ) { userData.push( { key: 'mobile phone', value: user.phone.mobile } ); }
		if( user.phone.preferred ) { userData.push( { key: 'preferred phone', value: user.phone.preferred } ); }
		if( user.address.street1 ) { userData.push( { key: 'street 1', value: user.address.street1 } ); }
		if( user.address.street2 ) { userData.push( { key: 'street 2', value: user.address.street2 } ); }
		if( !user.address.isOutsideMassachusetts && user.address.city.cityOrTown ) { userData.push( { key: 'city', value: user.address.city.cityOrTown } ); } // POPULATE IT
		if( user.address.isOutsideMassachusetts && user.address.cityText ) { userData.push( { key: 'city', value: user.address.cityText } ); }
		if( user.address.state.state ) { userData.push( { key: 'state', value: user.address.state.state } ); } // POPULATE
		if( user.address.zipCode ) { userData.push( { key: 'zip code', value: user.address.zipCode } ); }

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
			userData,
			registrationStaffContact
		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending new social worker notification email to MARE - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending new social worker notification email to MARE - ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendNewFamilyNotificationEmailToMARE = ( user, userEmail, registrationStaffContact ) => {
	
	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_NEW_FAMILY_REGISTERED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		if( !registrationStaffContact ) {
			return reject( `no staff contact was provided` );
		}
		// // an array was used instead of a Map because Mustache templates apparently can't handle maps
		// let userData = [];
		// let heardAboutMAREFromArray = [];

		// for( entry of user.heardAboutMAREFrom ) {
		// 	heardAboutMAREFromArray.push( entry.wayToHearAboutMARE );
		// }
		// // store only the fields that have been populated by the user
		// if( user.name.first ) { userData.push( { key: 'first name', value: user.name.first } ); }
		// if( user.name.last ) { userData.push( { key: 'last name', value: user.name.last } ); }
		// if( user.phone.work ) { userData.push( { key: 'work phone', value: user.phone.work } ); }
		// if( user.phone.home ) { userData.push( { key: 'home phone', value: user.phone.home } ); }
		// if( user.phone.mobile ) { userData.push( { key: 'mobile phone', value: user.phone.mobile } ); }
		// if( user.phone.preferred ) { userData.push( { key: 'preferred phone', value: user.phone.preferred } ); }
		// if( user.address.street1 ) { userData.push( { key: 'street 1', value: user.address.street1 } ); }
		// if( user.address.street2 ) { userData.push( { key: 'street 2', value: user.address.street2 } ); }
		// if( !user.address.isOutsideMassachusetts && user.address.city.cityOrTown ) { userData.push( { key: 'city', value: user.address.city.cityOrTown } ); }
		// if( user.address.isOutsideMassachusetts && user.address.cityText ) { userData.push( { key: 'city', value: user.address.cityText } ); }
		// if( user.address.state.state ) { userData.push( { key: 'state', value: user.address.state.state } ); }
		// if( user.address.zipCode ) { userData.push( { key: 'zip code', value: user.address.zipCode } ); }
		// if( heardAboutMAREFromArray.length !== 0 ) { userData.push( { key: 'heard about MARE from', value: heardAboutMAREFromArray } ); }
		// if( user.heardAboutMAREFromOther ) { userData.push( { key: 'heard about MARE from - other', value: user.heardAboutMAREFromOther } ); }

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
			userData,
			registrationStaffContact
		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending new family notification email to MARE - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending new family notification email to MARE - ${ err }` );
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
			return reject( `sending of the email is disabled` );
		}

		if( !userEmail ) {
			return reject( `no user email was provided` );
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
				return reject( `error sending account verification email to newly registered user - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending account verification email to newly registered user - ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendThankYouEmailToUser = ( staffContactInfo = { email: 'jared.j.collier@gmail.com', name: 'Jared' } , userEmail, userType, host ) => {
	
	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_REGISTRATION_THANK_YOU_EMAILS !== 'true' ) {
			// resolve the promise before any further processing takes place
			return reject( `sending of the email is disabled` );
		}

		if( !userEmail ) {
			return reject( `no user email was provided` );
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
				return reject( `error sending thank you email to newly registered user - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending thank you email to newly registered user - ${ err }` );
			}

			resolve();
		});
	});
};