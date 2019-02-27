// TODO: anything that needs to fetch the event to work should have a parameter for event, and if it's passed in, it uses that instead of fetching.  This would save several DB lookups

const keystone						= require( 'keystone' ),
	  eventEmailMiddleware			= require( './emails_event' ),
		emailTargetService		= require( './service_email-target' ),
	  staffEmailContactService	= require( './service_staff-email-contact' ),
	  userService					= require( './service_user' );

exports.getEventById = ( { eventId, fieldsToPopulate = [] } ) => {

	return new Promise( ( resolve, reject ) => {
		keystone.list( 'Event' ).model
			.findById( eventId )
			.populate( fieldsToPopulate )
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
			.populate( 'address.region' )
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
					console.log( `no active events could be found for user with id: ${ userId }` );
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

exports.getActiveEvents = () => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Event' ).model
			.find()
			.where( 'isActive', true )
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
				type: 'Mare hosted events',
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
				title: 'Your event has been submitted to be posted on the MARE website.',
				detail: 'Your submission will be reviewed within two business days and you will receive a notification email when your event has been posted. For additional questions contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>' } );

			// set the fields to populate on the fetched event model
			const fieldsToPopulate = [ 'contact', 'address.state' ];
			// populate the Relationship fields on the event
			event.populate( fieldsToPopulate, err => {
				// if there was an error populating Relationship fields on the event
				if ( err ) {
					// log the error for debugging purposes
					console.error( `error populating the new event fields` );
				// if there were no errors populating Relationship fields on the event
				} else {
					// set default information for a staff email contact in case the real contact info can't be fetched
					let staffEmailContactInfo = {
						name: { full: 'MARE' },
						email: 'web@mareinc.org'
					};

					// fetch the email target model matching 'event created by social worker'
					const fetchEmailTarget = emailTargetService.getEmailTargetByName( 'event created by social worker' );

					fetchEmailTarget
						// fetch contact info for the staff contact for 'event created by social worker'
						.then( emailTarget => staffEmailContactService.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
						// overwrite the default contact details with the returned object
						.then( staffEmailContact => staffEmailContactInfo = staffEmailContact.staffEmailContact )
						// log any errors fetching the staff email contact
						.catch( err => console.error( `error fetching email contact for event submission, default contact info will be used instead - ${ err }` ) )
						// send a notification email to MARE staff to allow them to enter the information in the old system
						.then( () => eventEmailMiddleware.sendNewEventEmailToMARE( event, socialWorker, staffEmailContactInfo ) )
						// if there was an error sending the email to MARE staff
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
						title: 'Something went wrong while submitting your event.',
						detail: 'If this issue persists, please notify MARE at <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>' } );
		})
		// execute the following regardless of whether the promises were resolved or rejected
		// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
		.then( () => {
			// reload the form to display the flash message
			res.redirect( 303, '/forms/agency-event-submission' );
		});
};

// create and save a new event model
exports.createEvent = event => {

	return new Promise( ( resolve, reject ) => {

		const Event = keystone.list( 'Event' );

		// create a new event using the form data we received
		const newEvent = new Event.model({

			name: event.name,
			displayName: event.name,
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

exports.register = ( eventDetails, user ) => {

	return new Promise( ( resolve, reject ) => {
		// get the user type that is registering for an event
		let attendeeType =  exports.getEventGroup( user.userType );

		// get the event that the user is registering for
		exports.getEventById( { eventId: eventDetails.eventId } )
			.then( event => {

				// add the user as an attendee to the existing list
				event[ attendeeType ] = event[ attendeeType ].concat( user.get( '_id' ) );

				// if there are registered children defined
				if ( eventDetails.registeredChildren ) {
					// add them to the list of attendees
					event.childAttendees = event.childAttendees.concat( eventDetails.registeredChildren );
				}

				// if there are unregistered children defined
				if ( eventDetails.unregisteredChildren ) {
					// add them to the list of attendees
					event.unregisteredChildAttendees = event.unregisteredChildAttendees.concat( eventDetails.unregisteredChildren );
				}

				// if there are unregistered adults defined
				if ( eventDetails.unregisteredAdults ) {
					// add them to the list of attendees
					event.unregisteredAdultAttendees = event.unregisteredAdultAttendees.concat( eventDetails.unregisteredAdults );
				}

				// save the updated event
				event.save( error => {

					if ( error ) {

						console.error( `error saving an update to event ${ event._id } - ${ error }` );
						reject( error );
					} else {

						resolve();
					}
				});
			})
			.catch( error => {

				console.error( `error registering user ${ user._id } for event ${ eventDetails.eventId } - ${ error }` );
				reject( error );
			});
	});
};

exports.unregister = ( eventDetails, user ) => {

	let unregistrationData;

	return new Promise( ( resolve, reject ) => {
		// get the user type that is unregistering for an event
		let attendeeType =  exports.getEventGroup( user.userType );

		// get the event that the user is registering for
		exports.getEventById( { eventId: eventDetails.eventId } )
			// remove the attendee from the event
			.then( event => {

				// get the index of the attendee to be removed
				let indexOfAttendee = event[ attendeeType ].indexOf( user._id );
				// splice the attendee from the list
				event[ attendeeType ].splice( indexOfAttendee, 1 );

				return event;
			})
			// remove any registered children attendees ( if applicable )
			.then( event => {

				if ( user.userType === 'social worker' ) {
					return exports.removeRegisteredChildren( event, user._id );
				} else {
					return { eventModel: event };
				}
			})
			.then( data => unregistrationData = data )
			.catch( err => console.error( `error removing registered children from event with id ${ eventDetails.eventId } - ${ err }` ) )
			// remove any unregistered child attendees
			.then( () => exports.removeUnregisteredChildren( unregistrationData.eventModel, user._id ) )
			.then( data => unregistrationData.unregisteredChildrenRemoved = data )
			.catch( err => console.error( `error removing unregistered children from event with id ${ eventDetails.eventId } - ${ err }` ) )
			// remove any unregistered adult attendees
			.then( () => exports.removeUnregisteredAdults( unregistrationData.eventModel, user._id ) )
			.then( data => unregistrationData.unregisteredAdultsRemoved = data )
			.catch( err => console.error( `error removing unregistered adults from event with id ${ eventDetails.eventId } - ${ err }` ) )
			// save the updated event
			.then( () => {

				// save the updated event
				unregistrationData.eventModel.save( error => {

					if ( error ) {
						// reject the promise with details of what went wrong
						reject( `error unregistering user ${ user._id } from event ${ eventDetails.eventId } - ${ error }` );
					} else {

						resolve({
							registeredChildrenRemoved: unregistrationData.registeredChildrenRemoved,
							unregisteredChildrenRemoved: unregistrationData.unregisteredChildrenRemoved,
							unregisteredAdultsRemoved: unregistrationData.unregisteredAdultsRemoved
						});
					}
				});
			})
			.catch( error => {
				// reject the promise with details about the error
				reject( `error unregistering user ${ user._id } for event ${ eventDetails.eventId } - ${ error }` );
			});
	});
};

exports.editRegistration = ( eventDetails, user ) => {
	return new Promise( async ( resolve, reject ) => {
		try {
			await exports.unregister( eventDetails, user );
			await exports.register( eventDetails, user );

			resolve();
		}
		catch( err ) {
			reject( `error editing user registration for event - ${ err }` );
		}
	});
};

exports.removeRegisteredChildren = ( event, registrantId ) => {

	return new Promise( ( resolve, reject ) => {
		// populate the registered children attendees of the event and remove any children that were signed up by the social worker that is unregistering for the event
		event.populate( 'childAttendees', error => {

			if ( error ) {
				// reject the promise with information about the error
				reject( `error populating the child attendees of event ${ event._id } - ${ error }` );
			} else {

				let registeredChildrenToRemoveIndexes = [];
				let registeredChildrenRemoved = [];

				// capture all registered children ( and their indexes ) that were signed up by the social worker that is unregistering
				event.childAttendees.forEach( ( child, index ) => {

					if ( child.adoptionWorker && ( registrantId.toString() === child.adoptionWorker.toString() || registrantId.toString() === child.recruitmentWorker.toString() ) ) {

						registeredChildrenToRemoveIndexes.push( index );
						registeredChildrenRemoved.push( child );
					}
				});

				// reverse the registeredChildrenToRemoveIndexes array to prevent the splicing process from messing with the array indexes
				registeredChildrenToRemoveIndexes.reverse();
				// remove each registered child from the list of child attendees
				registeredChildrenToRemoveIndexes.forEach( indexOfChild => {

					event.childAttendees.splice( indexOfChild, 1 );
				});

				resolve({
					eventModel: event,
					registeredChildrenRemoved
				});
			}
		});
	});
};

exports.removeUnregisteredChildren = ( event, registrantId ) => {

	// remove the unregistered children attendees of the event that were signed up by the user that is unregistering for the event
	let unregisteredChildrenToRemoveIndexes = [];
	let unregisteredChildrenRemoved = [];

	// capture all unregistered children ( and their indexes ) that were signed up by the user that is unregistering
	event.unregisteredChildAttendees.forEach( ( child, index ) => {

		if ( registrantId.toString() === child.registrantID ) {

			unregisteredChildrenToRemoveIndexes.push( index );
			unregisteredChildrenRemoved.push( child );
		}
	});

	// reverse the unregisteredChildrenToRemoveIndexes array to prevent the splicing process from messing with the array indexes
	unregisteredChildrenToRemoveIndexes.reverse();
	// remove each unregistered child from the list of child attendees
	unregisteredChildrenToRemoveIndexes.forEach( indexOfChild => {

		event.unregisteredChildAttendees.splice( indexOfChild, 1 );
	});

	return unregisteredChildrenRemoved;
};

exports.removeUnregisteredAdults = ( event, registrantId ) => {

	// remove the unregistered adult attendees of the event that were signed up by the user that is unregistering for the event
	let unregisteredAdultsToRemoveIndexes = [];
	let unregisteredAdultsRemoved = [];

	// capture all unregistered adult ( and their indexes ) that were signed up by the user that is unregistering
	event.unregisteredAdultAttendees.forEach( ( adult, index ) => {

		if ( registrantId.toString() === adult.registrantID ) {

			unregisteredAdultsToRemoveIndexes.push( index );
			unregisteredAdultsRemoved.push( adult );
		}
	});

	// reverse the unregisteredAdultsToRemoveIndexes array to prevent the splicing process from messing with the array indexes
	unregisteredAdultsToRemoveIndexes.reverse();
	// remove each unregistered adult from the list of adult attendees
	unregisteredAdultsToRemoveIndexes.forEach( indexOfChild => {

		event.unregisteredAdultAttendees.splice( indexOfChild, 1 );
	});

	return unregisteredAdultsRemoved;
};

/* 
 * Fetches the array of unregistered child attendee objects.
 *
 * @return [{
    "age": 5,
    "registrantID": "5a6ff5a82d436123456b5511",
    "_id": {
        "$oid": "5c758d9f81e123456481dd22"
    },
    "name": {
        "first": "firstName",
        "last": "lastName"
    }
}]
 */
exports.getUnregisteredChildren = eventId => {

	return new Promise( async ( resolve, reject ) => {

        try {
            const event = await exports.getEventById( { eventId } );

            if( !event.unregisteredChildAttendees ) {
                return resolve( [] );
            }

            resolve( event.unregisteredChildAttendees );
        }
        catch( error ) {
            reject( `error fetching unregistered child attendees for event with id ${ eventId }` );
        }
	});
};

/* 
 * Fetches the array of unregistered adult attendee objects.
 *
 * @return [{
    "registrantID": "5a6ff5a82d436123456b5511",
        "_id": {
            "$oid": "5c758d9f81e123456481dd22"
        },
        "name": {
            "first": "firstName",
            "last": "lastName"
        }
    }]
 */
exports.getUnregisteredAdults = eventId => {

	return new Promise( async ( resolve, reject ) => {
        try {
            const event = await exports.getEventById( { eventId } );

            if( !event.unregisteredAdultAttendees ) {
                return resolve( [] );
            }

            resolve( event.unregisteredAdultAttendees );
            
        }
        catch( error ) {
            reject( `error fetching unregistered adult attendees for event with id ${ eventId }` );
        }
	})
};

/* 
 * Fetches the array of registered child attendee objects.
 *
 * @return [Child models]
 */
exports.getRegisteredChildren = eventId => {

	return new Promise( async ( resolve, reject ) => {
        try {
			// set the array of fields to populate when the event model is fetched
			const fieldsToPopulate = [ 'childAttendees' ];

            const event = await exports.getEventById( { eventId, fieldsToPopulate } );

            if( !event.childAttendees ) {
                return resolve( [] );
            }

            resolve( event.childAttendees );
            
        }
        catch( error ) {
            reject( `error fetching registered child attendees for event with id ${ eventId }` );
        }
	})
};

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
		emailTargetService
			.getTargetId( emailTarget )
			.then( targetId => {
				// get the contact details of the admin contact set to handle registration questions for the email target
				return staffEmailContactService.getContactById( targetId );
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

exports.getEventContactEmail = ( { eventId, userType } ) => {

	return new Promise( async ( resolve, reject ) => {

		// get the event that the user is registering for
		try {
			const event = await exports.getEventById( { eventId } );

			let eventContactEmail;

			// if the user is a social worker, get the social worker contact before the family contact
			if( userType === 'social worker' ) {
				// if a social worker contact has been selected ( this is a relationship pointing to an admin user )
				if( event.contact ) {
					// fetch the social worker contact
					const socialWorkerContact = await userService.getUserByIdNew({
						id: event.contact,
						targetModel: keystone.list( 'Admin' )
					});
					// extract the email from the contact and store it as the event contact email
					eventContactEmail = socialWorkerContact.get( 'email' );
				// if no social worker contact has been set, fall back to the text field for their email if one exists
				} else if( event.contactEmail ) {
					eventContactEmail = event.contactEmail;
				// if no social worker contact information has been provided, check for a family contact ( this is also a relationship pointing to an admin user )
				} else if( event.familyContact ) {
					// fetch the family contact
					const familyContact = await userService.getUserByIdNew({
						id: event.familyContact,
						targetModel: keystone.list( 'Admin' )
					});
					// extract the email from the contact and store it as the event contact email
					eventContactEmail = familyContact.get( 'email' );
				// if no family contact has been set, fall back to the text field for the email if one exists
				} else if( event.familyContactEmail ) {
					eventContactEmail = event.familyContactEmail;
				}
			// if the user is a family, attempt to get the family contact before the social worker contact
			} else if( userType === 'family' ) {
				// if a family contact has been selected ( this is a relationship pointing to an admin user )
				if( event.familyContact ) {
					// attempt to fetch the family contact
					const familyContact = await userService.getUserByIdNew({
						id: event.familyContact,
						targetModel: keystone.list( 'Admin' )
					});
					// extract the email from the contact and store it as the event contact email
					eventContactEmail = familyContact.get( 'email' );
				// if no family contact has been set, fall back to the text field for the email if one exists
				} else if( event.familyContactEmail ) {
					eventContactEmail = event.familyContactEmail;
				// if no family contact information has been provided, check for a social worker contact ( this is also a relationship pointing to an admin user )
				} else if( event.contact ) {
					// attempt to fetch the social worker contact
					const socialWorkerContact = await userService.getUserByIdNew({
						id: event.contact,
						targetModel: keystone.list( 'Admin' )
					});
					// extract the email from the contact and store it as the event contact email
					eventContactEmail = socialWorkerContact.get( 'email' );
				// if no social worker contact has been set, fall back to the text field for their email if one exists
				} else if( event.contactEmail ) {
					eventContactEmail = event.contactEmail;
				}
			}
			// if no contact fields were filled out, fall back to the staff email contact for event registration
			if( !eventContactEmail ) {
				// get the general staff email target for an event registration
				const emailTarget = await emailTargetService.getEmailTargetByName( 'event registration' );
				// get the staff contact assigned to the email target
				const staffContact = await staffEmailContactService.getStaffEmailContactByEmailTarget( emailTarget._id, [ 'staffEmailContact' ] );
				// set the contact details to the fetched contact email
				eventContactEmail = staffContact.staffEmailContact.email;
			}
			// if there is still no contact email address to send to, default to web@mareinc.org
			eventContactEmail = eventContactEmail || 'web@mareinc.org';
			// resolve the promise with the event contact email if we could find a value to set for it
			resolve( eventContactEmail );

		}
		catch( error ) {
			reject( `error fetching event contact email for event with id ${ eventDetails.eventId } - ${ error }` );
		}
	});
};

exports.checkForOldEvents = () => {

	return new Promise( async ( resolve, reject ) => {
		// store the current date/time
		const now = new Date();

		let activeEvents;

		// attempt to fetch all events that are currently active in the system
		try {
			activeEvents = await this.getActiveEvents();
		}
		catch( err ) {
			return reject( `error fetching active events - ${ err }` );
		}

		// loop through all active events
		for( let event of activeEvents ) {
			// "9:00pm" will store [ "9:00pm", "9:00pm", "9", "00", "pm" ]
			let endTimeArray = /((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))/.exec( event.endTime );
			// if the event has a stored end time and is a valid date
			if( endTimeArray ) {
				// check if the time is AM or PM, then extract the hours and add 12 for PM times
				let endTimeHours = endTimeArray[ 4 ].toLowerCase() === 'pm'
					? parseInt( endTimeArray[ 2 ] ) + 12
					: parseInt( endTimeArray[ 2 ] );

				// use the extracted hours and day of the event to construct a date object for comparison
				event.endDate.setHours( endTimeHours );
				// if the event is not recurring and has ended before the current date/time
				if( !event.isRecurringEvent && event.endDate < now ) {
					// log a message for debugging purposes
					console.log( `deactivating event ${ event.name }` );
					// deactivate and save the event
					event.set( 'isActive', false );

					await event.save( err => {
						if( err ) {
							console.err( `error saving deactivated event ${ event.name } - ${ err }` );
						}
					});
				}
			}
		}

		resolve();
	});
};