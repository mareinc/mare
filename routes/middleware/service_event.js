const keystone	= require( 'keystone' ),
	  async		= require( 'async' ),
	  moment	= require( 'moment' ),
	  Event		= keystone.list( 'Event' );

exports.getEventById = eventId => {

	return new Promise( ( resolve, reject ) => {
		Event.model
			.findById( eventId )
			.exec()
			.then( event => {
				// if the target event could not be found
				if( !event ) {
					// log an error for debugging purposes
					console.error( `no event matching id '${ eventId } could be found` );
					// reject the promise
					return reject();
				}

				// if the target event was found, resolve the promise with the event
				resolve( event );
			// if there was an error fetching from the database
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching event matching id ${ eventId } - ${ err }` );
				// and reject the promise
				reject();
			});
	});
};
/* TODO: this is not reusable, but is needed to show a single event page.  Consider adding populate and possibly
		 building other elements of the Mongoose query dynamically using passed in options */
exports.getEventByKey = key => {
	
	return new Promise( ( resolve, reject ) => {
		// attempt to find a single event matching the passed in key, and populate some of the Relationship fields
		Event.model.findOne()
			.where( 'key', key )
			.populate( 'contact' )
			.populate( 'childAttendees' )
			.populate( 'familyAttendees' )
			.populate( 'socialWorkerAttendees' )
			.populate( 'siteVisitorAttendees' )
			.populate( 'staffAttendees' )
			.populate( 'address.state' )
			.exec()
			.then( event => {
				// if the target event could not be found
				if( !event ) {
					// log an error for debugging purposes
					console.error( `no event matching '${ name } could be found` );
				}
				// if the target event was found, resolve the promise with the event
				resolve( event );
			// if there was an error fetching from the database
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching event matching key ${ key } - ${ err }` );
				// and reject the promise
				reject();
			});
		});
};

/* TODO: this is not reusable, but is needed to show a events category page.  Consider adding populate and possibly
		 building other elements of the Mongoose query dynamically using passed in options */
exports.getActiveEventsByEventType = ( eventType, eventGroup ) => {
			
	return new Promise( ( resolve, reject ) => {

		Event.model.find()
			.where( 'type', eventType ) // grab only the events matching the target category
			.where( 'isActive', true ) // we don't want to show inactive events
			.populate( eventGroup )
			.populate( 'address.state' )
			.lean()
			.exec()
			.then( events => {
				// if no active events matching the passed in eventType could not be found
				if( events.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no active events matching '${ eventType } could be found` );
				}
				// resolve the promise with the events
				resolve( events );
			// if there was an error fetching from the database
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching active events matching ${ eventType } - ${ err }` );
				// and reject the promise
				reject();
			});
		});			
};

exports.getActiveEventsByUserId = ( userId, eventGroup ) => {
			
	return new Promise( ( resolve, reject ) => {

		Event.model.find()
			.where( 'isActive', true ) // we don't want to show inactive events
			.populate( eventGroup )
			.populate( 'address.state' )
			.lean()
			.exec()
			.then( events => {
				// if no active events could be found
				if( events.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no active events could be found for user with id: ${ userId }` );
				}
				// resolve the promise with the events
				resolve( events );
			// if there was an error fetching from the database
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching active events for user with id ${ userId } - ${ err }` );
				// and reject the promise
				reject();
			});
		});
};

exports.getAllActiveEvents = eventGroup => {
			
	return new Promise( ( resolve, reject ) => {

		Event.model.find()
			.where( 'isActive', true ) // we don't want to show inactive events
			.populate( eventGroup )
			.populate( 'address.state' )
			.exec()
			.then( events => {
				// if no active events could be found
				if( events.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no active events could be found` );
				}
				// resolve the promise with the events
				resolve( events );
			// if there was an error fetching from the database
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching active events - ${ err }` );
				// and reject the promise
				reject();
			});
		})
	;
};

exports.getEventGroup = userType => {

	switch( userType ) {
		case 'admin'			: return 'staffAttendees';
		case 'social worker'	: return 'socialWorkerAttendees';
		case 'site visitor'		: return 'siteVisitorAttendees';
		case 'family'			: return 'familyAttendees';
		default					: return ''; // needed to show events to anonymous users
	}
}

/* fetches a random event for the sidebar, which has restrictions as to what can be shown */
exports.getRandomEvent = () => {

	return new Promise( ( resolve, reject ) => {
		// query the database for a single random active event of the appprpriate type
		Event.model
			.findRandom({
				type: { $in: [ 'MARE adoption parties & information events', 'fundraising events' ] },
				isActive: true
			}, ( err, event ) => {
				// if there was an error
				if ( err ) {
					// log the error for debugging purposes
					console.error( `error fetching random event - ${ err }` );
					// reject the promise
					return reject();
				}
				// the single random event will be the 0th element in the returned array
				const randomEvent = event ? event[ 0 ] : {}; // TODO: make sure an empty response comes back as undefined instead of an empty array
				// resolve the promise with the random event
				resolve( randomEvent );
			});
	});
};

/*
 *	frontend services
 */
// exports.addUser = ( req, res, next ) => {
	
// 	const userId	= req.user.get( '_id' ),
// 		  userName	= req.user.get( 'name.full' ),
// 		  userType	= req.user.get( 'userType' ),
// 		  eventId	= req.body.eventId;

// 	// fetch the field the user should be added to based on their user type
// 	const eventGroup = exports.getEventGroup( userType );
// 	// fetch the event the user should be added to
// 	let fetchEvent = exports.getEventById( eventId );
		
// 	fetchEvent
// 		.then( event => {
// 			// get the array of user IDs already in the field the user should be added to, and get the index of the user
// 			const attendees	= event.get( eventGroup ),
// 				  userIndex	= attendees.indexOf( userId );
// 			// if the user is not already added
// 			if( userIndex === -1 ) {
// 				// add them to the attendees list
// 				attendees.push( userId );
// 				// save the updated event model to the database
// 				event.save();
// 				// construct useful data for needed UI updates
// 				var responseData = {
// 					success: true,
// 					action: 'register',
// 					name: userName,
// 					group: userType
// 				};
// 				// send the response data base to the user as JSON
// 				res.json( responseData );

// 			} else {
// 				// construct useful data for needed UI updates
// 				var responseData = {
// 					success: false,
// 					action: 'register',
// 					message: 'You are already attending that event'
// 				};
// 				// send the response data base to the user as JSON
// 				res.json( responseData );
// 			}
// 		})
// 		.catch( () => {
// 			// log an error for debugging purposes
// 			console.error( `there was an error adding the user to the event with id ${ req.body.eventId }` );	
			
// 			// construct useful data for needed UI updates
// 			var responseData = {
// 				success: false,
// 				action: 'register',
// 				message: 'An error occurred when adding you to the event'
// 			};
// 			// send the response data base to the user as JSON
// 			res.json( responseData );
// 		});
// };

// exports.removeUser = ( req, res, next ) => {

// 	const locals	= res.locals,
// 		  userId	= req.user.get( '_id' ),
// 		  userName	= req.user.get( 'name.full' ),
// 		  userType	= req.user.get( 'userType' ),
// 		  eventId	= req.body.eventId;

// 	// fetch the field the user should be added to based on their user type
// 	const eventGroup = exports.getEventGroup( userType );
// 	// fetch the event the user should be added to
// 	let fetchEvent = exports.getEventById( eventId );

// 	fetchEvent
// 		.then( event => {
// 			// get the array of user IDs already in the field the user should be added to, and get the index of the user
// 			const attendees	= event.get( eventGroup ),
// 				userIndex	= attendees.indexOf( userId );

// 			// if the user exists in the group
// 			if(userIndex !== -1) {
// 				// remove them from the attendees list
// 				attendees.splice( userIndex, 1 );
// 				// save the updated event model
// 				event.save();
// 				// construct useful data for needed UI updates
// 				var responseData = {
// 					success: true,
// 					action: 'unregister',
// 					name: userName,
// 					group: userType
// 				};
// 				// send the response data base to the user as JSON
// 				res.json( responseData );

// 			} else {
// 				// construct useful data for needed UI updates
// 				var responseData = {
// 					success: false,
// 					action: 'unregister',
// 					message: 'You have already been removed from that event'
// 				};
// 				// send the response data base to the user as JSON
// 				res.json( responseData );
// 			}
// 		})
// 		.catch( () => {
// 			// log an error for debugging purposes
// 			console.error( `there was an error removing the user from the event with id ${ req.body.eventId }` );	
			
// 			// construct useful data for needed UI updates
// 			var responseData = {
// 				success: false,
// 				action: 'register',
// 				message: 'An error occurred when removing you from the event'
// 			};
// 			// send the response data base to the user as JSON
// 			res.json( responseData );
// 		});
// };

/* event creation submitted through the agency event submission form */
exports.submitEvent = function submitEvent( req, res, next ) {

	const event = req.body;

	// attempt to create an event
	let createEvent = exports.createEvent( event );

	// if we're successful in creating it
	createEvent.then( result => {
		// create a success flash message
		req.flash( 'success', {
					title: 'Your event has been submitted',
					detail: 'once your event has been approved by the MARE staff, you will receive a notification email.  If you don\'t receive an email within 5 business days, please contact [some mare contact] for a status update.'} );
		// reload the form to display the flash message
		res.redirect( '/forms/agency-event-submission-form' );
	// if we're not successful in creating it
	})
	.catch( error => {
		// create an error flash message
		req.flash( 'error', {
					title: 'Something went wrong while creating your event.',
					detail: 'We are looking into the issue and will email a status update once it\'s resolved' } );
		// reload the form to display the flash message
		res.redirect( '/forms/agency-event-submission-form' );	
	});

};

// create and save a new event model
exports.createEvent = event => {

	return new Promise( ( resolve, reject ) => {
		// create a new event using the form data we received
		const newEvent = new Event.model({

			name: event.name,
			type: event.eventType,	
			address: {
				street1: event.street1,
				street2: event.street2,
				city: event.city,
				state: event.state,
				zipCode: event.zipCode
			},
			contactEmail: event.contactEmail,
			startDate: event.startDate,
			startTime: event.startTime,
			endDate: event.endDate,
			endTime: event.endTime,
			description: event.description,
			isActive: false,
			createdViaWebsite: true

		});

		newEvent.save( err => {
			// log a message that the event was created
			console.log( `new event successfully created` );
			// if the event was created successfully, resolve the event creation promise
			resolve();

		}, err => {
			// log an error for debugging purposes
			console.error( `there was an error creating the new event - ${ err }` );
			// reject the promise
			reject();
		});
	});
};

exports.register = ( eventId, userId ) => {
	// TODO: this will be implemented post-launch
	return new Promise( ( resolve, reject ) => {
		resolve();
	});
}

exports.unregister = ( eventId, userId ) => {
	// TODO: this will be implemented post-launch
	return new Promise( ( resolve, reject ) => {
		resolve();
	});
}