const keystone 				= require( 'keystone' ),
	  moment				= require( 'moment' ),
	  Utils					= require( '../middleware/utilities' ),
	  eventService			= require( '../middleware/service_event' ),
	  pageService			= require( '../middleware/service_page' ),
	  socialWorkerService	= require( '../middleware/service_social-worker' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals,
		  userId	= req.user ? req.user.get( '_id' ) : undefined,
		  userType	= req.user ? req.user.get( 'userType' ) : undefined; // knowing the type of user visiting the page will allow us to display extra relevant information
	// extract request object parameters into local constants
	const { category } = req.params;

	// used to map the url to the stored event for determining which subset of events to show
	let eventType;

	// find the field the user belongs to in the event model based on their user type
	const eventGroup = eventService.getEventGroup( userType );

	switch( category ) {
		case 'adoption-parties'			: eventType = 'MARE adoption parties & information events'; break;
		case 'mapp-trainings'			: eventType = 'MAPP trainings'; break;
		case 'fundraising-events'		: eventType = 'fundraising events'; break;
		case 'agency-info-meetings'		: eventType = 'agency information meetings'; break;
		case 'other-trainings'			: eventType = 'other opportunities & trainings'; break;
	}

	// track whether it is an event users can register for through the site
	// admin can't register, and everyone else can only register for select types of events
	locals.canRegister = userType !== 'admin'
						 && [ 'fundraising events',
							  'MARE adoption parties & information events' ].includes( eventType );

	// only social workers can submit events, and only for specific types of events
	locals.canSubmitEvent = userType === 'social worker'
							&& [ 'MAPP trainings',
								 'agency information meetings',
								 'other opportunities & trainings' ].includes( eventType );

	// store on locals for access during templating
	locals.category = category;
	locals.userType = userType;

	// fetch all data needed to render this page
	let fetchEvents					= eventService.getActiveEventsByEventType( eventType, eventGroup ),
		fetchSidebarItems			= pageService.getSidebarItems(),
		fetchSocialWorkersChildren	= socialWorkerService.fetchRegisteredChildren( userId );

	Promise.all( [ fetchEvents, fetchSidebarItems, fetchSocialWorkersChildren ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ events, sidebarItems, registeredChildren ] = values;
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
				event.hasAddress = event.address && event.address.street1;

				// if the user is logged in
				if( req.user ) {
					// loop through each of the attendees in the group that matches the users type
					for( let attendee of event[ eventGroup ] ) {
						// without converting to strings, these were both evaluating to Object which didn't allow for a clean comparison
						var attendeeID	= attendee._id.toString(),
							userID		= req.user._id.toString();

						// determine whether the user has already attended the event
						event.attended = attendeeID === userID;
					};
				}

				// check to see if the event spans multiple days
				const multidayEvent = event.startDate.getTime() !== event.endDate.getTime();

				const startDate	= moment( event.startDate ).format( 'dddd MMMM Do, YYYY' ),
					  endDate	= moment( event.endDate ).format( 'dddd MMMM Do, YYYY' );
				
				// pull the date and into a string for easier templating
				event.displayDate = multidayEvent ? `${ startDate } to ${ endDate }` : startDate;
			};

			// assign properties to locals for access during templating
			locals.events				= events;
			locals.hasNoEvents			= events.length === 0;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			locals.displayName			= req.user ? req.user.displayName : '';
			locals.hasChildren			= registeredChildren.length > 0;
			locals.registeredChildren	= registeredChildren;
			locals.redirectPath			= req.url;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the events.hbs template
			view.render( 'events' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the event list page - ${ err }` );	
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the events.hbs template
			view.render( 'events' );
		});
};
