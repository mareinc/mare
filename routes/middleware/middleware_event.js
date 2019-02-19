const emailTargetService		= require( './service_email-target' ),
	  staffEmailContactService	= require( './service_staff-email-contact' ),
	  eventService				= require( './service_event' ),
	  eventEmailMiddleware		= require( './emails_event' );

exports.register = async ( req, res ) => {
	'use strict';

	let emailTarget,
		staffContact,
		staffContactEmail = 'web@mareinc.org', // default information for a staff email contact in case the real contact info can't be fetched
		isRegisteredSuccessfully = false;

	// extract the event information from the req object
	const eventDetails = req.body;
	// extract request object parameters into local constants
	eventDetails.eventId = req.params.eventId;

	// if there are unregistered child attendees
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

	// attempt to register the user for the event
	try {
		await eventService.register( eventDetails, req.user );
		// notify the user that they were successful ( the code to notify MARE executes after this message is sent )
		req.flash( 'success', { title: 'MARE has been notified of your registration',
			detail: 'You can expect to receive a confirmation email with additional details prior to the event' });
		// note that the registration was a success
		isRegisteredSuccessfully = true;
	}
	// if there was an error registering the user for the event
	catch ( err ) {
		// log the error for debugging purposes
		console.error( `error registering ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` );
		// notify the user of the error
		req.flash( 'error', { title: 'There was an issue registering you for this event',
			detail: 'If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>' } );
	}
	// send out emails only if they successfully registered for the event
	if( isRegisteredSuccessfully ) {
		// attempt to fetch the correct staff contact email address
		try {
			// get the email target for an event registration
			emailTarget = await emailTargetService.getEmailTargetByName( 'event registration' );
			// get the staff contact assigned to the email target
			staffContact = await staffEmailContactService.getStaffEmailContactByEmailTarget( emailTarget._id, [ 'staffEmailContact' ] );
			// overwrite the default contact details with the returned object
			staffContactEmail = staffContact.staffEmailContact.email;
		}
		// if there was an error determining the staff email contact
		catch( err ) {
			// log the error for debugging purposes
			console.error( `error fetching email contact for event registration by ${ req.user.displayName } for ${ eventDetails.eventName }, default contact info will be used instead - ${ err }` );
		}

		// attempt to send an email to the staff contact with the registration info
		try {
			await eventEmailMiddleware.sendEventRegistrationEmailToMARE( eventDetails, req.user, res.host, staffContactEmail );
		}
		catch( err ) {
			// log the error for debugging purposes
			console.error( `error sending event registration email to ${ staffContactEmail } about ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` );
		}
	}
	// update the stage for families only if they successfully registered for the event
	if( isRegisteredSuccessfully && req.user.userType === 'family' ) {

		let family = req.user,
			isSaveNeeded = false,
			adjustedCurrentDate = new Date().setHours( new Date().getHours() - 5 ); // done because new Date() was saving 5 hours ahead
		// if changes were made to the stage, we need to resave the family with the updated stage and date information
		switch( eventDetails.whereInTheProcess ) {
			// if the family set their stage to 'gathering information'
			case 'gathering information':
				// check to see if 'gathering information' is already selected in the family model
				if( !family.stages.gatheringInformation.started ) {
					// if not, check 'gathering information' and set the date to today
					family.set( 'stages.gatheringInformation.started', true );
					family.set( 'stages.gatheringInformation.date', adjustedCurrentDate );
				}
				// note that we need to save the family model
				isSaveNeeded = true;

				break;
			// if the family set their stage to 'looking for agency'
			case 'looking for agency':
				// check to see if 'looking for agency' is already selected in the family model
				if( !family.stages.lookingForAgency.started ) {
					// if not, check 'looking for agency' and set the date to today
					family.set( 'stages.lookingForAgency.started', true );
					family.set( 'stages.lookingForAgency.date', adjustedCurrentDate );
				}
				// note that we need to save the family model
				isSaveNeeded = true;

				break;
			// if the family set their stage to 'working with agency'
			case 'working with agency':
				// check to see if 'working with agency' is already selected in the family model
				if( !family.stages.workingWithAgency.started ) {
					// if not, check 'working with agency' and set the date to today
					family.set( 'stages.workingWithAgency.started', true );
					family.set( 'stages.workingWithAgency.date', adjustedCurrentDate );
				}
				// note that we need to save the family model
				isSaveNeeded = true;

				break;
			// if the family set their stage to 'MAPP training completed'
			case 'MAPP training completed':
				// check to see if 'MAPP training completed' is already selected in the family model
				if( !family.stages.MAPPTrainingCompleted.completed ) {
					// if not, check 'MAPP training completed' and set the date to today
					family.set( 'stages.MAPPTrainingCompleted.completed', true );
					family.set( 'stages.MAPPTrainingCompleted.date', adjustedCurrentDate );
				}
				// note that we need to save the family model
				isSaveNeeded = true;

				break;
			// if the family set their stage to 'homestudy completed'
			case 'homestudy completed':
				// check to see if 'homestudy completed' is already selected in the family model
				if( !family.homestudy.completed ) {
					// if not, check 'homestudy completed', set the initial date to today, and clear out the most recent date
					family.set( 'homestudy.completed', true );
					family.set( 'homestudy.initialDate', adjustedCurrentDate );
					family.set( 'homestudy.mostRecentDate', undefined );
				}
				// note that we need to save the family model
				isSaveNeeded = true;

				break;
		}

		// if changes were made, attempt to resave the family
		if( isSaveNeeded ) {
			family.save( () => {}, err => {
				// log the error for debugging purposes
				console.error( `there was an error updating the stage for family ${ family.displayName } with id ${ family._id } while they were registering for event ${ eventDetails.eventName } - ${ err }` );
			});
		}
	}

	// once all actions ahve been completed, redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
	res.redirect( 303, eventDetails.redirectPath );
};

// TODO: Update to use async/await
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

exports.editRegistration = async ( req, res, next ) => {
	'use strict';

	// extract the event information from the req object
	const eventDetails = req.body;
	// extract request object parameters into local constants
	eventDetails.eventId = req.params.eventId;

	// if there are unregistered child attendees
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
	// attempt to edit the users event registration
	try {
		await eventService.editRegistration( eventDetails, req.user );

		res.redirect( 303, eventDetails.redirectPath );
	}
	catch( err ) {
		console.error( `error editing event registration - ${ err }` );
	}
};
