const eventService			= require( './service_event' ),
	  eventEmailMiddleware	= require( './emails_event' );

exports.register = async ( req, res ) => {
	'use strict';

	let isRegisteredSuccessfully = false;

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

	try {
		// register the user for the event
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
		// fetch the correct staff contact email address
		try {

			console.log( `TEST REGISTER - about to fetch staff email contact for ${ req.user.userType } ${ req.user.displayName } - ${ eventDetails.eventName }` );

			// fetch the correct email contact based on the user type and what information is available on the event
			const eventContactEmail = await eventService.getEventContactEmail({
				eventId: eventDetails.eventId,
				userType: req.user.userType
			});

			console.log( `TEST REGISTER - about to send email for successful registration to ${ eventContactEmail } for ${ req.user.userType } ${ req.user.displayName } - ${ eventDetails.eventName }` );

			// send an email to the staff contact with the registration info
			await eventEmailMiddleware.sendEventRegistrationEmailToMARE( eventDetails, req.user, res.host, eventContactEmail );
		}
		catch( err ) {
			// log the error for debugging purposes
			console.error( `error sending event registration email about ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` );
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

	// once all actions have been completed, redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
	res.redirect( 303, eventDetails.redirectPath );
};

exports.unregister = async ( req, res ) => {
	'use strict';

	let isUnregisteredSuccessfully = false;

	// extract the event information from the req object
	const eventDetails = req.body;
	// extract request object parameters into local constants
	eventDetails.eventId = req.params.eventId;

	try {
		// unregister the user from the event
		const unregistrationData = await eventService.unregister( eventDetails, req.user );

		// add any registered children that were removed
		eventDetails.registeredChildrenRemoved = ( unregistrationData.registeredChildrenRemoved && unregistrationData.registeredChildrenRemoved.length > 0 )
			? unregistrationData.registeredChildrenRemoved
			: undefined;
		// add any unregistered children that were removed
		eventDetails.unregisteredChildrenRemoved = ( unregistrationData.unregisteredChildrenRemoved && unregistrationData.unregisteredChildrenRemoved.length > 0 )
			? unregistrationData.unregisteredChildrenRemoved
			: undefined;
		// add any unregistered adults that were removed
		eventDetails.unregisteredAdultsRemoved = ( unregistrationData.unregisteredAdultsRemoved && unregistrationData.unregisteredAdultsRemoved.length > 0 )
			? unregistrationData.unregisteredAdultsRemoved
			: undefined;

		// note that the registration was a success
		isUnregisteredSuccessfully = true;
		
		// notify the user that they were successful
		req.flash( 'success', { title: 'MARE has been notified of your change in registration',
			detail: 'For additional questions contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>' } );
	}
	// if there was an issue registering the attendee
	catch( error ) {
		// log the error for debugging purposes
		console.error( `error unregistering ${ req.user.displayName } for ${ eventDetails.eventName } - ${ error }` );
		// notify the user of the error
		req.flash( 'error', { title: 'There was an issue changing your registration for this event',
			detail: 'If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>' } );
	}

	// send out emails only if they successfully registered for the event
	if( isUnregisteredSuccessfully ) {
		// fetch the correct staff contact email address
		try {

			console.log( `TEST UNREGISTER - about to fetch staff email contact for ${ req.user.userType } ${ req.user.displayName } - ${ eventDetails.eventName }` );

			// fetch the correct email contact based on the user type and what information is available on the event
			const eventContactEmail = await eventService.getEventContactEmail({
				eventId: eventDetails.eventId,
				userType: req.user.userType
			});

			console.log( `TEST UNREGISTER - about to send email for successful registration to ${ eventContactEmail } for ${ req.user.userType } ${ req.user.displayName } - ${ eventDetails.eventName }` );

			// send an email to the staff contact with the registration info
			await eventEmailMiddleware.sendEventUnregistrationEmailToMARE( eventDetails, req.user, res.host, eventContactEmail );
		}
		catch( err ) {
			// log the error for debugging purposes
			console.error( `error sending event unregistration email about ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` );
		}
	}
	// once all actions have been completed, redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
	res.redirect( 303, eventDetails.redirectPath );
};

exports.editRegistration = async ( req, res, next ) => {
	'use strict';

	let isRegisteredSuccessfully = false;

	let unregisteredAdults,
		unregisteredChildren,
		registeredChildren;

	// extract the event information from the req object
	const eventDetails = req.body;
	// extract request object parameters into local constants
	eventDetails.eventId = req.params.eventId;
	eventDetails.unregisteredAdults = [];
	eventDetails.unregisteredChildren = [];

	// if there are unregistered child attendees
	if ( eventDetails.numberOfChildren > 0 ) {
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

	try {
		// fetch all unregistered adult and child objects associated with the event
		unregisteredAdults = await eventService.getUnregisteredAdults( eventDetails.eventId );
		unregisteredChildren = await eventService.getUnregisteredChildren( eventDetails.eventId );
		registeredChildren = await eventService.getRegisteredChildren( eventDetails.eventId );
		// edit the users event registration
		await eventService.editRegistration( eventDetails, req.user );
		// notify the user that they were successful ( the code to notify MARE executes after this message is sent )
		req.flash( 'success', { title: 'MARE has been notified of your changes',
			detail: 'You can expect to receive a confirmation email with additional details prior to the event' });
		// note that the registration was a success
		isRegisteredSuccessfully = true;
	}
	// if there was an error registering the user for the event
	catch ( err ) {
		// log the error for debugging purposes
		console.error( `error editing registration for ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` );
		// notify the user of the error
		req.flash( 'error', { title: 'There was an issue editing your registration for this event',
			detail: 'If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>' } );
	}

	// send out emails only if they successfully registered for the event
	if( isRegisteredSuccessfully ) {
		// fetch the correct staff contact email address
		try {
			// filter out all unregistered adults who were not registered by the user
			const usersUnregisteredAdults = unregisteredAdults.filter( adult => adult.registrantID === req.user.get( '_id' ).toString() );
			// filter out all unregistered children who were not registered by the user
			const usersUnregisteredChildren = unregisteredChildren.filter( child => child.registrantID === req.user.get( '_id' ).toString() );
			// filter out all registered children who don't have the user as an adoption or recruitment worker
			const usersRegisteredChildren = registeredChildren.filter( child => {
				return ( child.adoptionWorker && child.adoptionWorker.toString() === req.user.get( '_id' ).toString() )
					|| ( child.recruitmentWorker && child.recruitmentWorker.toString() === req.user.get( '_id' ).toString() );
			});
		
			// extract a string of the name of the adults, and name and age of the children, and store them in arrays
			// NOTE: without ids on the submitted children and adults, there's no clean way to compare them
			const unregisteredAdultStrings = usersUnregisteredAdults.map( adult => `${ adult.name.first } ${ adult.name.last }` );
			const unregisteredChildStrings = usersUnregisteredChildren.map( child => `${ child.name.first } ${ child.name.last } (age ${ child.age })` );
			// extract the ids of the registered children and store them in an array
			const registeredChildIds = usersRegisteredChildren.map( child => child.get( '_id' ).toString() );

			// extract a string of the name of the adults, and name and age of the children, and store them in arrays
			const submittedUnregisteredAdultStrings = eventDetails.unregisteredAdults.map( adult => `${ adult.name.first } ${ adult.name.last }` );
			const submittedUnregisteredChildStrings = eventDetails.unregisteredChildren.map( child => `${ child.name.first } ${ child.name.last } (age ${ child.age })` );
			
			// convert unregistered children and adults to sets to easily determine who was added and removed
			const unregisteredAdultSet = new Set( unregisteredAdultStrings );
			const unregisteredChildSet = new Set( unregisteredChildStrings );
			const submittedUnregisteredAdultSet = new Set( submittedUnregisteredAdultStrings );
			const submittedUnregisteredChildSet = new Set( submittedUnregisteredChildStrings );
			// convert registered children to sets to easily determine who was added and removed
			const registeredChildSet = new Set( registeredChildIds );
			const submittedRegisteredChildSet = new Set( eventDetails.registeredChildren );

			const addedUnregisteredAdults = submittedUnregisteredAdultSet.leftOuterJoin( unregisteredAdultSet );
			const addedUnregisteredChildren = submittedUnregisteredChildSet.leftOuterJoin( unregisteredChildSet );
			const removedUnregisteredAdults = submittedUnregisteredAdultSet.rightOuterJoin( unregisteredAdultSet );
			const removedUnregisteredChildren = submittedUnregisteredChildSet.rightOuterJoin( unregisteredChildSet );
			const addedRegisteredChildren = submittedRegisteredChildSet.leftOuterJoin( registeredChildSet );
			const removedRegisteredChildren = submittedRegisteredChildSet.rightOuterJoin( registeredChildSet );

			console.log( `TEST EDIT - about to fetch staff email contact for ${ req.user.userType } ${ req.user.displayName } - ${ eventDetails.eventName }` );

			// fetch the correct email contact based on the user type and what information is available on the event
			const eventContactEmail = await eventService.getEventContactEmail({
				eventId: eventDetails.eventId,
				userType: req.user.userType
			});

			console.log( `TEST EDIT - about to send email for successful edit to ${ eventContactEmail } for ${ req.user.userType } ${ req.user.displayName } - ${ eventDetails.eventName }` );

			// send an email to the staff contact with the registration info if changes exist
			if( addedUnregisteredAdults.size > 0
				|| addedUnregisteredChildren.size > 0
				|| removedUnregisteredAdults.size > 0
				|| removedUnregisteredChildren.size > 0
				|| addedRegisteredChildren.size > 0
				|| removedRegisteredChildren.size > 0
			) {
				await eventEmailMiddleware.sendEventRegistrationEditedEmailToMARE({
					eventDetails,
					addedRegisteredChildren: Array.from( addedRegisteredChildren ),
					addedUnregisteredChildren: Array.from( addedUnregisteredChildren ),
					addedUnregisteredAdults: Array.from( addedUnregisteredAdults ),
					removedRegisteredChildren: Array.from( removedRegisteredChildren ),
					removedUnregisteredChildren: Array.from( removedUnregisteredChildren ),
					removedUnregisteredAdults: Array.from( removedUnregisteredAdults ),
					userDetails: req.user,
					host: res.host,
					staffContactEmail: eventContactEmail
				});
			}
		}
		catch( err ) {
			// log the error for debugging purposes
			console.error( `error sending event registration edited email about ${ req.user.displayName } for ${ eventDetails.eventName } - ${ err }` );
		}
	}

	// once all actions have been completed, redirect the user to the path specified in the request. Needed because otherwise it would be impossible to determine which page they registered from
	res.redirect( 303, eventDetails.redirectPath );
};
