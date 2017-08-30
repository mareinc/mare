const keystone 				= require( 'keystone' ),
	  eventService			= require( './service_event' ),
	  eventEmailMiddleware	= require( './emails_event' );

exports.register = ( req, res, next ) => {
	'use strict';
	// extract the event information from the req object
	const eventDetails = req.body;
	// extract request object parameters into local constants
	const { eventId } = req.params;
	// attempt to register the user and send a notification email to MARE staff
	let register	= eventService.register( eventId, req.user.get( '_id' ) ),
		notifyStaff	= eventEmailMiddleware.sendEventRegistrationEmailToStaff( eventDetails, eventId, 'jared.j.collier@gmail.com' ); // TODO: need to fetch the staff contact to send the email to
	
	// create a flash message to notify the user that these emails are turned off
	req.flash( 'info', { title: `sending of event registration emails is currently turned off, no email was sent` } );

	// if all promises resolved without issue
	Promise.all( [ register, notifyStaff ] ).then( () => {
		// notify the user that the registration was successful
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
	const { eventName, redirectPath } = req.body;
	// extract request object parameters into local constants
	const { eventId } = req.params;
	// attempt to register the user and send a notification email to MARE staff
	let unregister	= eventService.unregister( eventId, req.user.get( '_id' ) ),
		notifyStaff	= eventEmailMiddleware.sendEventUnregistrationEmailToStaff( eventName, eventId, 'jared.j.collier@gmail.com' ); // TODO: need to fetch the staff contact to send the email to
	// create a flash message to notify the user that these emails are turned off
	req.flash( 'info', { title: `sending of event unregistration emails is currently turned off, no email was sent` } );

	// if all promises resolved without issue
	Promise.all( [ unregister, notifyStaff ] ).then( () => {
		// notify the user that the registration was successful
		req.flash( 'success', { title: 'MARE has been notified of your unregistration',
				   detail: 'your removal will be processed in 1-3 business days and someone will reach out if additional information is needed' });
		// redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
		res.redirect( 303, redirectPath );
	})
	// if one or more promises were rejected
	.catch( err => {
		// log the issue for debugging purposes
		console.error( `there was an issue registering ${ req.user.displayName } for ${ eventName } - ${ err }` );
		// notify the user of the error
		req.flash( 'error', { title: 'There was an issue unregistering you for this event',
				   detail: 'If this error persists, please notify MARE' } );
		// redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
		res.redirect( 303, redirectPath );
	});
};