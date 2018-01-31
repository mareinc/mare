const keystone						= require( 'keystone' ),
	  async							= require( 'async' ),
	  moment						= require( 'moment' ),
	  eventEmailMiddleware			= require( './emails_event' ),
	  emailTargetMiddleware			= require( './service_email-target' ),
	  staffEmailContactMiddleware	= require( './service_staff-email-contact' ),
	  eventService					= require( './service_event' );

exports.getEventById = ( eventId, populateOptions = [] ) => {

	return new Promise( ( resolve, reject ) => {
		keystone.list( 'Event' ).model
			.findById( eventId )
			.populate( populateOptions )
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
		keystone.list( 'Event' ).model
			.findOne()
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

		keystone.list( 'Event' ).model
			.find()
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
					console.error( `no active events matching ${ eventType } could be found` );
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

		keystone.list( 'Event' ).model
			.find()
			.where( 'isActive', true ) // we don't want to show inactive events
			.where( eventGroup ).in( [userId] ) // only show events for this user
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

		keystone.list( 'Event' ).model
			.find()
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
		keystone.list( 'Event' )
			.model
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

/* event creation submitted through the agency event submission form */
exports.submitEvent = function submitEvent( req, res, next ) {
	// store the event and social worker information in a local variable
	const event			= req.body,
		  socialWorker	= req.user;

	// attempt to create the event
	const createEvent = exports.createEvent( event );

	// once the event has been successfully created
	createEvent
		.then( event => {
			// create a success flash message
			req.flash( 'success', {
				title: 'Your event has been submitted',
				detail: 'once your event has been approved by MARE staff, you will receive a notification email.  If you don\'t receive an email within 5 business days, please contact [some mare contact] for a status update.'} );
			
			// set the fields to populate on the fetched event model
			const populateOptions = [ 'contact', 'address.state' ];		
			// populate the Relationship fields on the event
			event.populate( populateOptions, err => {
				// if there was an error populating Relationship fields on the event
				if ( err ) {
					// log the error for debugging purposes
					console.error( `error populating the new event fields` );
				// if there were no errors populating Relationship fields on the event
				} else {
					// fetch the email target model matching 'event created by social worker'
					const fetchEmailTarget = emailTargetMiddleware.getEmailTargetByName( 'event created by social worker' );
					
					fetchEmailTarget
						// if we successfully fetched the email target model
						.then( emailTarget => {
							// set the fields to populate on the staff email contact model
							const populateOptions = [ 'staffEmailContact' ];
							// fetch contact info for the staff contact for 'event created by social worker'
							return staffEmailContactMiddleware.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), populateOptions );
						})
						// if we successfully fetched the staff email contact
						.then( staffEmailContact => {
							// send a notification email to MARE staff to allow them to enter the information in the old system
							return eventEmailMiddleware.sendNewEventEmailToMARE( event, socialWorker, staffEmailContact );
						})
						.catch( err => {
							// convert the event date from a date object into a readable string
							const eventDate = `${ event.startDate.getMonth() + 1 }/${ event.startDate.getDate() }/${ event.startDate.getFullYear() }`;
							// throw an error with details about what went wrong
							console.error( `error sending new event created email to MARE contact about ${ event.get( 'name' ) } on ${ eventDate } from ${ event.get( 'startTime' ) } to ${ event.get( 'endTime' ) } - ${ err }` );
						});
				}
			});
		})
		// if we're not successful in creating the event
		.catch( err => {
			// log the error for debugging purposes
			console.error( err );
			// create an error flash message
			req.flash( 'error', {
						title: 'Something went wrong while creating your event.',
						detail: 'We are looking into the issue and will email a status update once it\'s resolved' } );
		})
		// execute the following regardless of whether the promises were resolved or rejected
		// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
		.then( () => {
			// reload the form to display the flash message
			res.redirect( 303, '/forms/agency-event-submission-form' );
		});
};

// create and save a new event model
exports.createEvent = event => {

	return new Promise( ( resolve, reject ) => {

		const Event = keystone.list( 'Event' );

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

		newEvent.save( ( err, model ) => {
			// if there was an error saving the new event to the database
			if( err ) {
				// log an error for debugging purposes
				console.error( `there was an error creating the new event - ${ err }` );
				// reject the promise
				return reject();
			}

			// resolve the promise with the newly saved event model
			resolve( model );
		});
	});
};

exports.register = ( eventId, userId ) => {
	// TODO: this will be implemented post-launch
	return new Promise( ( resolve, reject ) => {
		resolve();
	});
};

exports.unregister = ( eventId, userId ) => {
	// TODO: this will be implemented post-launch
	return new Promise( ( resolve, reject ) => {
		resolve();
	});
};

/* returns an array of staff email contacts */
exports.getEventStaffContactInfo = emailTarget => {

	return new Promise( ( resolve, reject ) => {
		// if the email target was unrecognized, the email target can't be set
		if( !emailTarget ) {
			// reject the promise with details of the issue
			return reject( `no event email target provided` );
		}
		// TODO: it was nearly impossible to create a readable comma separated list of links in the template with more than one address,
		// 	     so we're only fetching one contact when we should fetch them all
		// get the database id of the admin contact set to handle registration questions for the email target
		emailTargetMiddleware
			.getTargetId( emailTarget )
			.then( targetId => {
				// get the contact details of the admin contact set to handle registration questions for the email target
				return staffEmailContactMiddleware.getContactById( targetId );
			})
			.then( contactInfo => {
				// resolve the promise with the full name and email address of the contact
				resolve( contactInfo );
			})
			.catch( err => {
				// reject the promise with the reason for the rejection
				reject( `error fetching staff contact - ${ err }` );
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