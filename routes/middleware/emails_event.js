const Email = require( 'keystone-email' ),
	  hbs = require( 'hbs' ),
	  childService = require('./service_child');

exports.sendNewEventEmailToMARE = ( event, socialWorker, staffEmailContact ) => {

	return new Promise( ( resolve, reject ) => {

		const staffEmail = staffEmailContact.email;

		// if sending of the email is not currently allowed
		if( process.env.SEND_EVENT_CREATED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		// find the email template in templates/emails/
		Email.send(
			// template path
			'event-created-notification-to-mare',
			// email options
			{
				engine: 'hbs',
                transport: 'mandrill',
				root: 'templates/emails/'
			// render options
			}, {
                startDate: `${ event.startDate.getMonth() + 1 }/${ event.startDate.getDate() }/${ event.startDate.getFullYear() }`,
				endDate: `${ event.endDate.getMonth() + 1 }/${ event.endDate.getDate() }/${ event.endDate.getFullYear() }`,
				event,
				socialWorker,
				layout: false
			// send options
			}, {
				apiKey: process.env.MANDRILL_APIKEY,
				to: staffEmail,
				from: {
					name: 'MARE',
					email: 'web@mareinc.org'
				},
				subject: `new event created`
			// callback
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
					return reject( `error sending new event created notification email to MARE - ${ response.status } - ${ response.email } - ${ response.reject_reason } - ${ err }` );
				}

				resolve();
			});
	});
};

exports.sendEventRegistrationEmailToMARE = ( eventDetails, userDetails, host, staffContactEmail ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if ( process.env.SEND_EVENT_REGISTRATION_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		exports.getRegisteredChildData( eventDetails.registeredChildren )
			.then( registeredChildrenData => {

				// replace the list of registered children IDs with the full model data
				eventDetails.registeredChildren = registeredChildrenData;

				// perform field-level validation for email templating
				if( eventDetails.source === 'other' ) {
					eventDetails.source = `Other: ${ eventDetails.otherSource }`;
				}

				// set custom display name if necessary
				var displayName = userDetails.userType === 'family' ? userDetails.displayName : undefined;

				// find the email template in templates/emails/
				Email.send(
					// template path
					'event-registration-notification-to-mare',
					// email options
					{
						engine: 'hbs',
						transport: 'mandrill',
						root: 'templates/emails/'
					// render options
					}, {
						event: eventDetails,
						user: userDetails,
						host,
						displayName,
						layout: false
					// send options
					}, {
						apiKey: process.env.MANDRILL_APIKEY,
						to: staffContactEmail,
						from: {
							name: 'MARE',
							email: 'web@mareinc.org'
						},
						subject: `new event registration`,
					// callback
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
			})
			.catch( error => {

				reject( error );
			});
	});
};

exports.sendEventUnregistrationEmailToMARE = ( eventDetails, userDetails, host, staffContactEmail ) => {

	return new Promise( ( resolve, reject ) => {
		// TODO: check the logic around process.env.migration, it doesn't seem to make sense
		// if sending of the email is not currently allowed
		if( process.env.SEND_EVENT_UNREGISTRATION_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		// set custom display name if necessary
		var displayName = userDetails.userType === 'family' ? userDetails.displayName : undefined;

		// find the email template in templates/emails/
		Email.send(
			// template path
			'event-unregistration-notification-to-mare',
			// email options
			{
				engine: 'hbs',
				transport: 'mandrill',
				root: 'templates/emails/'
			// render options
			}, {
				event: eventDetails,
				user: userDetails,
				host,
				displayName,
				layout: false
			// send options
			}, {
				apiKey: process.env.MANDRILL_APIKEY,
				to: staffContactEmail,
				from: {
					name: 'MARE',
					email: 'web@mareinc.org'
				},
				subject: `event unregistration`
			// callback
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

exports.sendEventRegistrationEditedEmailToMARE = ({
	eventDetails,
	addedRegisteredChildren,
	addedUnregisteredChildren,
	addedUnregisteredAdults,
	removedRegisteredChildren,
	removedUnregisteredChildren,
	removedUnregisteredAdults,
	userDetails,
	host,
	staffContactEmail
}) => {
	return new Promise( async (resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_EVENT_EDITED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the event edited email is disabled` );
		}

		try {
			const addedRegisteredChildrenData = await exports.getRegisteredChildData( addedRegisteredChildren );
			const removedRegisteredChildrenData = await exports.getRegisteredChildData( removedRegisteredChildren );

			// perform field-level validation for email templating
			if( eventDetails.source === 'other' ) {
				eventDetails.source = `Other: ${ eventDetails.otherSource }`;
			}

			// set custom display name if necessary
			var displayName = userDetails.userType === 'family' ? userDetails.displayName : undefined;

			// find the email template in templates/emails/
			Email.send(
				// template path
				'event-registration-edited-notification-to-mare',
				// email options
				{
					engine: 'hbs',
					transport: 'mandrill',
					root: 'templates/emails/'
				// render options
				}, {
					event: eventDetails,
					user: userDetails,
					addedRegisteredChildren: addedRegisteredChildrenData,
					addedUnregisteredChildren: addedUnregisteredChildren.length > 0 ? addedUnregisteredChildren : null,
					addedUnregisteredAdults: addedUnregisteredAdults.length > 0 ? addedUnregisteredAdults : null,
					removedRegisteredChildren: removedRegisteredChildrenData,
					removedUnregisteredChildren: removedUnregisteredChildren.length > 0 ? removedUnregisteredChildren : null,
					removedUnregisteredAdults: removedUnregisteredAdults.length > 0 ? removedUnregisteredAdults : null,
					host,
					displayName,
					layout: false
				// send options
				}, {
					apiKey: process.env.MANDRILL_APIKEY,
					to: staffContactEmail,
					from: {
						name: 'MARE',
						email: 'web@mareinc.org'
					},
					subject: `event registration change`
				// callback
				}, ( err, message ) => {
					// log any errors
					if( err ) {
						return reject( `error sending event registration edited email to staff - ${ err }` );
					}
					// the response object is stored as the 0th element of the returned message
					const response = message ? message[ 0 ] : undefined;
					// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
					if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
						// reject the promise with details
						return reject( `new event registration edited email to staff failed to send: ${ message } - ${ err }` );
					}

					resolve();
				});
			}
			catch( error ) {
				console.error( `error sending event registration edited email to staff - ${ error }` );

				reject();
			}
	});
}

exports.getRegisteredChildData = (registeredChildren) => {

	return new Promise( ( resolve, reject ) => {

		// if the event registration includes registered children attendees
		if( registeredChildren && registeredChildren.length > 0 ) {

			// get the children data
			childService.getChildrenByIds( registeredChildren )
				.then( childrenData => {

					resolve( childrenData );
				})
				.catch( error => {

					reject( error );
				});

			// if the event registration doesn't include registered children attendees
		} else {

			// resolve the promise without any child data
			resolve();
		}
	});
};
