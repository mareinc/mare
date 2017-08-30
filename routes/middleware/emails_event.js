const keystone = require( 'keystone' );

exports.sendEventRegistrationEmailToStaff = ( registrationInfo, eventId, registrationStaffContact ) => {
	
	return new Promise( ( resolve, reject ) => {
		// TODO: check the logic around process.env.migration, it doesn't seem to make sense
		// if sending of the email is not currently allowed
		if( process.env.SEND_EVENT_REGISTRATION_TO_STAFF === 'false' ) {
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

exports.sendEventUnregistrationEmailToStaff = ( eventName, eventId, registrationStaffContact ) => {
	
	return new Promise( ( resolve, reject ) => {
		// TODO: check the logic around process.env.migration, it doesn't seem to make sense
		// if sending of the email is not currently allowed
		if( process.env.SEND_EVENT_UNREGISTRATION_TO_STAFF === 'false' ) {
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