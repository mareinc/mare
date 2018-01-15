const keystone = require( 'keystone' );

exports.sendNewEventEmailToMARE = ( event, user, registrationStaffContact ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_EVENT_CREATED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		if( !registrationStaffContact ) {
			return reject( `no staff was contact provided` );
		}

		// find the email template in templates/emails/
		new keystone.Email({
			templateExt		: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'event-created-notification-to-staff'
		}).send({
			to				: registrationStaffContact.email,
			from: {
				name 		: 'MARE',
				email 		: 'admin@adoptions.io'
			},
			subject			: `new event created`,
			startDate		: `${ event.startDate.getMonth() + 1 }/${ event.startDate.getDate() }/${ event.startDate.getFullYear() }`,
			endDate			: `${ event.endDate.getMonth() + 1 }/${ event.endDate.getDate() }/${ event.endDate.getFullYear() }`,
			event,
			user
		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending new event created notification email to MARE - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending new event created notification email to MARE - ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendEventRegistrationEmailToMARE = ( registrationInfo, eventId, registrationStaffContact ) => {
	
	return new Promise( ( resolve, reject ) => {
		// TODO: check the logic around process.env.migration, it doesn't seem to make sense
		// if sending of the email is not currently allowed
		if( process.env.SEND_EVENT_REGISTRATION_TO_MARE !== 'true' ) {
			// resolve the promise before any further processing takes place
			return resolve();
		}
		// find the email template in templates/emails/
		new keystone.Email({

			templateExt 	: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'event_user-registered'

		}).send({

			to: 'jared.j.collier@gmail.com',
			from: {
				name 	: 'MARE',
				email 	: 'admin@adoptions.io'
			}

		}, ( err, message ) => {
			// log any errors
			if( err ) {
				return reject( `error sending event registration thank you email - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `new event registration email to staff failed to send: ${ message } - ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendEventUnregistrationEmailToMARE = ( eventName, eventId, registrationStaffContact ) => {
	
	return new Promise( ( resolve, reject ) => {
		// TODO: check the logic around process.env.migration, it doesn't seem to make sense
		// if sending of the email is not currently allowed
		if( process.env.SEND_EVENT_UNREGISTRATION_TO_MARE !== 'true' ) {
			// resolve the promise before any further processing takes place
			return resolve();
		}
		// find the email template in templates/emails/
		new keystone.Email({

			templateExt 	: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'event_user-unregistered'

		}).send({

			to: 'jared.j.collier@gmail.com',
			from: {
				name 	: 'MARE',
				email 	: 'admin@adoptions.io'
			}

		}, ( err, message ) => {
			// log any errors
			if( err ) {
				return reject( `error sending event unregistration thank you email - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `new event unregistration email to staff failed to send: ${ message } - ${ err }` );
			}

			resolve();
		});
	});
};