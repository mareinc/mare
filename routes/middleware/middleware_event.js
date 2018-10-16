const emailTargetService		= require( './service_email-target' ),
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
				registrantID: req.user._id
			};

			eventDetails.unregisteredChildren.push( unregisteredChildAttendee );
		}
	}

	// if there are unregistered adult attendees
	if ( eventDetails.numberOfAdults > 0 ) {

		eventDetails.unregisteredAdults = [];

		// compile unregistered adult attendee data into a single array
		for ( let i = 0; i < eventDetails.numberOfAdults; i++ ) {

			let unregisteredAdultAttendee = {
				name: {
					first: eventDetails.adultFirstName[ i ],
					last: eventDetails.adultLastName[ i ]
				},
				registrantID: req.user._id
			};

			eventDetails.unregisteredAdults.push( unregisteredAdultAttendee );
		}
	}

	// set default information for a staff email contact in case the real contact info can't be fetched
	let staffContactEmail = 'web@mareinc.org';
	// register the user for the event
	let registerAttendee = eventService.register( eventDetails, req.user );

	registerAttendee
		// notify the user that the registration was successful
		.then( () => {
			// notify the user that they were successful
			req.flash( 'success', { title: 'MARE has been notified of your registration',
				detail: 'You can expect to receive a confirmation email with additional details prior to the event' });
		})
		// if there was an issue registering the attendee
		.catch( err => {
			// log the error for debugging purposes
			console.error( `error registering ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` );
			// notify the user of the error
			req.flash( 'error', { title: 'There was an issue registering you for this event',
				detail: 'If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>' } );
		})
		// get the email target for an event registration
		.then( () => emailTargetService.getEmailTargetByName( 'event registration' ) )
		// get the staff contact assigned to the email target
		.then( emailTarget => staffEmailContactService.getStaffEmailContactByEmailTarget( emailTarget._id, [ 'staffEmailContact' ] ) )
		// overwrite the default contact details with the returned object
		.then( staffContact => staffContactEmail = staffContact.staffEmailContact.email )
		// log any errors fetching the staff email contact
		.catch( err => console.error( `error fetching email contact for event registration, default contact info will be used instead - ${ err }` ) )
		// check on the status of registering the attendee.  This ensures the email won't be sent out unless the attendee was registered successfully
		.then( () => registerAttendee )
		// send an email to the staff contact with the registration info
		.then( () => eventEmailMiddleware.sendEventRegistrationEmailToMARE( eventDetails, req.user, res.host, staffContactEmail ) )
		// if there was an error sending the registration email to MARE
		.catch( err => console.error( `error sending event registration email to MARE contact about ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` ) )
		// once all actions have been completed
		.then( () => {
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
	
	// set default information for a staff email contact in case the real contact info can't be fetched
	let staffContactEmail = 'web@mareinc.org';
	// register the user for the event
	let unregisterAttendee = eventService.unregister( eventDetails, req.user );

	unregisterAttendee
		// process information about children to remove and notify the user that the unregistration was successful
		.then( unregistrationData => {
			// add any registered children that were removed
			eventDetails.registeredChildrenRemoved = ( unregistrationData.registeredChildrenRemoved && unregistrationData.registeredChildrenRemoved.length > 0 ) ? unregistrationData.registeredChildrenRemoved : undefined;
			// add any unregistered children that were removed
			eventDetails.unregisteredChildrenRemoved = ( unregistrationData.unregisteredChildrenRemoved && unregistrationData.unregisteredChildrenRemoved.length > 0 ) ? unregistrationData.unregisteredChildrenRemoved : undefined;
			// add any unregistered adults that were removed
			eventDetails.unregisteredAdultsRemoved = ( unregistrationData.unregisteredAdultsRemoved && unregistrationData.unregisteredAdultsRemoved.length > 0 ) ? unregistrationData.unregisteredAdultsRemoved : undefined;
			
			// notify the user that they were successful
			req.flash( 'success', { title: 'MARE has been notified of your change in registration',
				detail: 'For additional questions contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>' } );
		})
		// if there was an issue registering the attendee
		.catch( err => {
			// log the error for debugging purposes
			console.error( `error unregistering ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` );
			// notify the user of the error
			req.flash( 'error', { title: 'There was an issue changing your registration for this event',
				detail: 'If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>' } );
		})
		// get the email target for an event unregistration
		.then( () => emailTargetService.getEmailTargetByName( 'event registration' ) )
		// get the staff contact assigned to the email target
		.then( emailTarget => staffEmailContactService.getStaffEmailContactByEmailTarget( emailTarget._id, [ 'staffEmailContact' ] ) )
		// overwrite the default contact details with the returned object
		.then( staffContact => staffContactEmail = staffContact.staffEmailContact.email )
		// log any errors fetching the staff email contact
		.catch( err => console.error( `error fetching email contact for event registration, default contact info will be used instead - ${ err }` ) )
		// check on the status of unregistering the attendee.  This ensures the email won't be sent out unless the attendee was unregistered successfully
		.then( () => unregisterAttendee )
		// send an email to the staff contact with the unregistration info
		.then( () => eventEmailMiddleware.sendEventUnregistrationEmailToMARE( eventDetails, req.user, res.host, staffContactEmail ) )
		// if there was an error sending the registration email to MARE
		.catch( err => console.error( `error sending event unregistration email to MARE contact about ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` ) )
		// once all actions have been completed
		.then( () => {
			// redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
			res.redirect( 303, eventDetails.redirectPath );
		});
};
