const keystone 		= require( 'keystone' ),
	  moment		= require( 'moment' ),
	  Utils			= require( '../middleware/utilities' ),
	  eventService	= require( '../middleware/service_event' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals,
		  userType	= req.user ? req.user.userType : ''; // knowing the type of user visiting the page will allow us to display extra relevant information
	
	// used to map the url to the stored event for determining which subset of events to show
	let eventType;

	// find the field the user belongs to in the event model based on their user type
	const eventGroup = eventService.getEventGroup( userType );

	// Use the URL stored in the request object to determine what event type we need to list out
	const targetList = req.originalUrl.replace( '/events/', '' );

	switch( targetList ) {
		case 'adoption-parties/'		: eventType = 'MARE adoption parties & information events'; locals.showAdoptionParties = true; break;
		case 'mapp-trainings/'			: eventType = 'MAPP trainings'; locals.showMAPPTrainings = true; break;
		case 'fundraising-events/'		: eventType = 'fundraising events'; locals.showFundraisingEvents = true; break;
		case 'agency-info-meetings/'	: eventType = 'agency information meetings'; locals.showAgencyInfoMeetings = true; break;
		case 'other-trainings/'			: eventType = 'other opportunities & trainings'; locals.showOtherTrainings = true; break;
		default							: eventType = '';
	}

	// determine if the user is a social worker.  We want to allow them to create events if they are
	locals.isSocialWorker = userType === 'social worker';

	// track whether it is an event users can register for through the site
	locals.canRegister = eventType === 'MARE adoption parties & information events' ||
						 eventType === 'fundraising events';

	locals.canSubmitEvent = locals.isSocialWorker && 
							( eventType === 'MAPP trainings' ||
							  eventType === 'agency information meetings' ||
							  eventType === 'other opportunities & trainings' );

	// fetch all data needed to render this page
	let fetchEvents			= eventService.getActiveEventsByEventType( eventType, eventGroup ),
		fetchSidebarItems	= pageService.getSidebarItems();

	Promise.all( [ fetchEvents, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ events, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;

			// options to define how truncation will be handled
			const truncateOptions = { targetLength: 400 }

			// loop through all the events
			for( let event of events ) {
				// the list page needs truncated details information to keep the cards they're displayed on small
				event.shortContent = Utils.truncateText( event.description, truncateOptions );
				// determine whether or not address information exists for the event, which is helpful during rendering
				// street1 is required, so this is enough to tell us if the address has been populated
				event.hasAddress = event.address && event.address.street1 ? true : false;

				for( let attendee of event[ eventGroup ] ) {
					// without converting to strings, these were both evaluating to Object which didn't allow for a clean comparison
					var attendeeID	= attendee._id.toString(),
						userID		= req.user._id.toString();

					// determine whether the user has already attended the event
					event.attended = attendeeID === userID ? true : false;
				};

				// check to see if the event spans multiple days
				const multidayEvent = event.startDate.getTime() !== event.endDate.getTime();
				
				// Pull the date and time into a string for easier templating
				if( multidayEvent ) {
					event.dateString = moment( event.startDate ).format( 'dddd MMMM Do, YYYY' ) + ' to ' + moment( event.endDate ).format( 'dddd MMMM Do, YYYY' );
				} else {
					event.dateString = moment( event.startDate ).format( 'dddd MMMM Do, YYYY' );
				}
			};

			// assign properties to locals for access during templating
			locals.events				= events;
			locals.hasNoEvents			= events.length === 0;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the eventList.hbs template
			view.render( 'eventList' );
		})
		.catch( () => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the event list page` );	
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the eventList.hbs template
			view.render( 'eventList' );
		});
};
