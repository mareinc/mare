const keystone 				= require( 'keystone' ),
	  moment				= require( 'moment' ),
	  Utils					= require( '../middleware/utilities' ),
	  eventService			= require( '../middleware/service_event' ),
	  pageService			= require( '../middleware/service_page' ),
	  socialWorkerService	= require( '../middleware/service_social-worker' ),
	  userService			= require( '../middleware/service_user' );

exports = module.exports = async ( req, res ) => {
	'use strict';

	const view = new keystone.View( req, res ),
		  locals = res.locals,
		  userId = req.user ? req.user.get( '_id' ).toString() : undefined,
		  userType = req.user ? req.user.get( 'userType' ) : undefined, // knowing the type of user visiting the page will allow us to display extra relevant information
		  MAREHostedEvents = [], // for MARE hosted events only
		  eventsWithNoRegion = [], // for non-MARE hosted events, events with no region information will be placed under a 'no region' header
		  eventsInUsersRegion = [], // for non-MARE hosted events, events in the user's region will be displayed first
		  eventsOutsideUsersRegion = []; // for non-MARE hosted events, events are displayed with headers, this lets us organize events by region
	
	let user,
		userRegion;

	if( req.user ) {
		// fetch the target model to allow us to find the correct user from their user type pool
		const targetModel = await userService.getTargetModel( userType );
		// specify which relationship fields we want to populate when we fetch the user model
		const fieldsToPopulate = [ 'address.region' ];
		// the user object can't just be pulled from req.user because we need to populate the region Relationship field	
		user = await userService.getUserByIdNew( { id: userId, targetModel, fieldsToPopulate } );
		// knowing the user's region will allow us to display events around them first
		userRegion = user.address.region ? user.address.region.region : undefined; 
	}

	// extract request object parameters into local constants
	const { category } = req.params;

	// used to map the url to the stored event for determining which subset of events to show
	let eventType;

	// find the field the user belongs to in the event model based on their user type
	const eventGroup = eventService.getEventGroup( userType );

	switch( category ) {
		case 'mapp-trainings'			: eventType = 'MAPP trainings'; break;
		case 'mare-hosted-events'		: eventType = 'Mare hosted events'; break;
		case 'partner-hosted-events'	: eventType = 'partner hosted events'; break;
	}

	// only social workers can submit events, and only for specific types of events
	locals.canSubmitEvent = userType === 'social worker'
		&& eventType !== 'Mare hosted events';
	
	// only admin can export events to excel, and only for MARE hosted events
	locals.canExportEvent = userType === 'admin'
		&& eventType === 'Mare hosted events';

	// store on locals for access during templating
	locals.category = category;
	locals.userType = userType;

	// fetch all data needed to render this page
	let fetchEvents					= eventService.getActiveEventsByEventType( eventType, eventGroup ),
		fetchSidebarItems			= pageService.getSidebarItems(),
		fetchSocialWorkersChildren	= socialWorkerService.fetchSocialWorkersChildren( userId );

	Promise.all( [ fetchEvents, fetchSidebarItems, fetchSocialWorkersChildren ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ events, sidebarItems, socialWorkersChildren ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;

			// options to define how truncation will be handled
			const truncateOptions = { targetLength: 400 };

			// loop through all the events
			for( let event of events ) {
				// cache the event region
				const eventRegion = event.address.region ? event.address.region.region : undefined;
				// check to see if registration is blocked for the user's type in the event model
				const isRegistrationBlocked =
					userType === 'site visitor' ? !!event.preventSiteVisitorRegistration
					: userType === 'family' ? !!event.preventFamilyRegistration
					: userType === 'social worker' ? !!event.preventSocialWorkerRegistration
					: false;

				// track whether it is an event users can register for through the site
				// admin can't register, and everyone else can only register for select types of events if registration isn't blocked in the event model
				event.canRegister = userType !== 'admin'
					&& eventType === 'Mare hosted events'
					&& !isRegistrationBlocked;

				// the list page needs truncated details information to keep the cards they're displayed on small
				event.shortContent = Utils.truncateText( { text: event.description, options: truncateOptions } );
				// determine whether or not address information exists for the event, which is helpful during rendering
				// street1 is required, so this is enough to tell us if the address has been populated
				event.hasAddress = event.address && event.address.street1;

				// if the user is logged in and the event has attendees of the user's type
				if( user && event[ eventGroup ] ) {
					// loop through each of the attendees in the group that matches the user's type
					for( let attendee of event[ eventGroup ] ) {
						// without converting to strings, these were both evaluating to Object which didn't allow for a clean comparison
						const attendeeId	= attendee._id.toString(),
							  userId		= user._id.toString();

						// determine whether the user has already attended the event
						event.attended = attendeeId === userId;
					};
				}

				// check to see if the event spans multiple days
				const multidayEvent = event.startDate
					&& event.endDate
					&& event.startDate.getTime() !== event.endDate.getTime();

				const startDate	= moment( event.startDate ).utc().format( 'dddd MMMM Do, YYYY' ),
					  endDate	= moment( event.endDate ).utc().format( 'dddd MMMM Do, YYYY' );
				
				// pull the date and into a string for easier templating
				event.displayDate = multidayEvent ? `${ startDate } to ${ endDate }` : startDate;

				// get a list of registered and unregistered children/adults the user said they were bringing when they registered
				const allChildAttendeeIds = event.childAttendees.map( childId => childId.toString() );
				const registeredChildrenUserIsBringing = socialWorkersChildren.filter( attendee => allChildAttendeeIds.includes( attendee._id.toString() ) );
				const unregisteredChildrenUserIsBringing = event.unregisteredChildAttendees.filter( child => child.registrantID === userId );
				const unregisteredAdultsUserIsBringing = event.unregisteredAdultAttendees.filter( adult => adult.registrantID === userId );

				// store information about who the user is bringing on the event
				event.isUserBringingChildren				= registeredChildrenUserIsBringing.length > 0;
				event.isUserBringingUnregisteredChildren	= unregisteredChildrenUserIsBringing.length > 0;
				event.isUserBringingUnregisteredAdults		= unregisteredAdultsUserIsBringing.length > 0;
				event.registeredChildrenUserIsBringing		= registeredChildrenUserIsBringing.map( child => `{ "name": "${ child.name.full }", "id": "${ child._id }" }` );
				event.unregisteredChildrenUserIsBringing	= unregisteredChildrenUserIsBringing.map( child => `{ "name": { "first": "${ child.name.first }", "last": "${ child.name.last }" }, "age": ${ child.age }, "id": "${ child._id }" }` );
				event.unregisteredAdultsUserIsBringing		= unregisteredAdultsUserIsBringing.map( adult => `{ "name": { "first": "${adult.name.first }", "last": "${ adult.name.last }" }, "id": "${ adult._id }" }` );

				// MARE hosted events don't need region headers, so they can all be stored in a single array
				if( eventType === 'Mare hosted events' ) {
					// add the events to the MARE hosted events array
					MAREHostedEvents.push( event );
				// MAPP trainings and partner hosted events need region headers, so we must divide them into separate arrays for templating
				} else {
					// if the event doesn't have a region specified, add it to the array for events with no region
					if( !eventRegion ) {
						eventsWithNoRegion.push( event );
					// if the event is in the user's region, add it to the events array for the user's region
					} else if( eventRegion === userRegion ) {
						eventsInUsersRegion.push( event );
					// if the event is not in the user's region, add it to the events map for that region
					} else {
						// loop through the events not in the user's region and capture the object for a region's events if one exists
						let targetEventGroup = eventsOutsideUsersRegion.find( eventGroup => {
							return eventGroup.region === eventRegion;
						});
						// if an object for a region's events was found that matches the event's region, add the event to its array
						if( targetEventGroup ) {
							targetEventGroup.events.push( event );
						// if no object for a region's events was found that matches the event's region, create it
						} else {
							let targetEventGroup = { region: eventRegion, events: [ event ] };
							eventsOutsideUsersRegion.push( targetEventGroup );
						}
					}
				}
			};

			const MAREHostedEventsExist			= MAREHostedEvents.length > 0,
				  eventsWithNoRegionExist		= eventsWithNoRegion.length > 0,
				  eventsInUsersRegionExist		= eventsInUsersRegion.length > 0,
				  eventsOutsideUsersRegionExist	= eventsOutsideUsersRegion.length > 0;

			// if MARE hosted events exist
			if( MAREHostedEventsExist ) {
				// sort the events in reverse-chonological order
				MAREHostedEvents.sort( ( a, b ) => {
					// recurring events must show above all other events, so we give them a date closest to the current date/time to ensure this
					let aDate = a.isRecurringEvent ? new Date() : a.startDate;
					let bDate = b.isRecurringEvent ? new Date() : b.startDate;

					return aDate - bDate;
				});
			}
			// if events exist outside the user's region
			if( eventsWithNoRegionExist ) {
				// sort the events in reverse-chonological order
				eventsWithNoRegion.sort( ( a, b ) => {
					// recurring events must show above all other events, so we give them a date closest to the current date/time to ensure this
					let aDate = a.isRecurringEvent ? new Date() : a.startDate;
					let bDate = b.isRecurringEvent ? new Date() : b.startDate;
					
					return aDate - bDate;
				});
			}
			// if events exist in the user's region
			if( eventsInUsersRegionExist ) {
				// sort the events in reverse-chonological order
				eventsInUsersRegion.sort( ( a, b ) => {
					// recurring events must show above all other events, so we give them a date closest to the current date/time to ensure this
					let aDate = a.isRecurringEvent ? new Date() : a.startDate;
					let bDate = b.isRecurringEvent ? new Date() : b.startDate;
					
					return aDate - bDate;
				});
			}
			// if events outside the user's region exist
			if( eventsOutsideUsersRegionExist ) {
				// sort each event group alphabetically by region
				eventsOutsideUsersRegion.sort( (a, b ) => {
					return a.region > b.region;
				});
				// loop through each group of events (each group is for a single region)
				for( let eventGroup of eventsOutsideUsersRegion ) {
					// sort each group's events in reverse-chonological order
					eventGroup.events.sort( ( a, b ) => {
						// recurring events must show above all other events, so we give them a date closest to the current date/time to ensure this
						let aDate = a.isRecurringEvent ? new Date() : a.startDate;
						let bDate = b.isRecurringEvent ? new Date() : b.startDate;
						
						return aDate - bDate;
					});
				}
			}

			// assign properties to locals for access during templating
			locals.userRegion						= userRegion;
			locals.MAREHostedEvents					= MAREHostedEvents; // only populated for MARE hosted events
			locals.eventsWithNoRegion				= eventsWithNoRegion; // only populated for non-MARE hosted events
			locals.eventsInUsersRegion				= eventsInUsersRegion; // only populated for non-MARE hosted events
			locals.eventsOutsideUsersRegion			= eventsOutsideUsersRegion; // only populated for non-MARE hosted events
			locals.MAREHostedEventsExist			= MAREHostedEventsExist;
			locals.eventsWithNoRegionExist			= eventsWithNoRegionExist;
			locals.eventsInUsersRegionExist			= eventsInUsersRegionExist;
			locals.eventsOutsideUsersRegionExist	= eventsOutsideUsersRegionExist;
			locals.hasNoEvents						= events.length === 0;
			locals.randomSuccessStory				= randomSuccessStory;
			locals.randomEvent						= randomEvent;
			locals.displayName						= user ? user.displayName : '';
			locals.hasSocialWorkersChildren			= socialWorkersChildren.length > 0;
			locals.socialWorkersChildren			= socialWorkersChildren;
			locals.redirectPath						= req.url;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the events.hbs template
			view.render( 'events' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the event list page - ${ err }` );	
			// render the view using the events.hbs template
			view.render( 'events' );
		});
};
