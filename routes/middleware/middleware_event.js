const keystone 					= require( 'keystone' ),
	  emailTargetService		= require( './service_email-target' ),
	  staffEmailContactService	= require( './service_staff-email-contact' ),
	  eventService				= require( './service_event' ),
	  eventEmailMiddleware		= require( './emails_event' );

exports.register = ( req, res, next ) => {
	'use strict';
	// extract the event information from the req object
	const eventDetails = req.body;
	// extract request object parameters into local constants
	eventDetails.eventId = req.params.eventId;

	// if there are unregistered children attendees
	if ( eventDetails.numberOfChildren > 0 ) {

		eventDetails.unregisteredChildren = [];

		// compile unregistered children attendee data into a single array
		for ( let i = 0; i < eventDetails.numberOfChildren; i++ ) {

			let unregisteredChildAttendee = {
				name: {
					first: eventDetails.childFirstName[ i ],
					last: eventDetails.childLastName[ i ]
				},
				age: eventDetails.childAge[ i ],
				socialWorkerID: req.user._id
			};

			eventDetails.unregisteredChildren.push( unregisteredChildAttendee );
		}
	}

	// initialize a promise chain
	Promise.resolve()
		// register the attendee for the event
		.then( () => eventService.register( eventDetails, req.user ))
		// get the email target for an event registration
		.then( () => emailTargetService.getEmailTargetByName( 'event registration' ))
		// get the staff contact assigned to the email target
		.then( emailTarget => staffEmailContactService.getStaffEmailContactByEmailTarget( emailTarget._id, [ 'staffEmailContact' ] ))
		// send an email to the staff contact with the registration info
		.then( staffContact => eventEmailMiddleware.sendEventRegistrationEmailToMARE( eventDetails, req.user, res.host, staffContact.staffEmailContact.email ))
		// notify the user that the registration was successful
		.then( () => {

			req.flash( 'success', { title: 'MARE has been notified of your registration',
				detail: 'your registration will be processed in 1-3 business days and someone will reach out if additional information is needed' });

			// redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
			res.redirect( 303, eventDetails.redirectPath );
		})
		// if one or more promises were rejected
		.catch( err => {
			// log the issue for debugging purposes
			console.error( `there was an issue registering ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` );
			// notify the user of the error
			req.flash( 'error', { title: 'There was an issue registering you for this event',
					detail: 'If this error persists, please notify MARE' } );
			// redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
			res.redirect( 303, eventDetails.redirectPath );
		});
};

exports.unregister = ( req, res, next ) => {
	'use strict';
	// extract the event information from the req object
	const eventDetails = req.body;
	// extract request object parameters into local constants
	eventDetails.eventId = req.params.eventId;
	// attempt to register the user and send a notification email to MARE staff
	let unregister	= eventService.unregister( eventDetails, req.user );
		//notifyStaff	= eventEmailMiddleware.sendEventUnregistrationEmailToStaff( eventName, eventId, 'jared.j.collier@gmail.com' ); // TODO: need to fetch the staff contact to send the email to
	// create a flash message to notify the user that these emails are turned off
	req.flash( 'info', { title: `sending of event unregistration emails is currently turned off, no email was sent` } );

	// if all promises resolved without issue
	Promise.all( [ unregister ] ).then( () => {
		// notify the user that the registration was successful
		req.flash( 'success', { title: 'MARE has been notified of your unregistration',
				   detail: 'your removal will be processed in 1-3 business days and someone will reach out if additional information is needed' });
		// redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
		res.redirect( 303, eventDetails.redirectPath );
	})
	// if one or more promises were rejected
	.catch( err => {
		// log the issue for debugging purposes
		console.error( `there was an issue registering ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` );
		// notify the user of the error
		req.flash( 'error', { title: 'There was an issue unregistering you for this event',
				   detail: 'If this error persists, please notify MARE' } );
		// redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
		res.redirect( 303, eventDetails.redirectPath );
	});
};
