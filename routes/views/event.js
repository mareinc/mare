const keystone				= require( 'keystone' ),
	  _						= require( 'underscore' ),
	  moment				= require( 'moment' ),
	  eventService			= require( '../middleware/service_event' ),
	  pageService			= require( '../middleware/service_page' ),
	  socialWorkerService	= require( '../middleware/service_social-worker' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view 		= new keystone.View( req, res ),
		  locals 	= res.locals,
		  userId	= req.user ? req.user.get( '_id' ) : undefined,
    	  userType	= req.user ? req.user.userType : ''; // knowing the type of user visiting the page will allow us to display extra relevant information
	// extract request object parameters into local constants
	const { category, key } = req.params;

	// used to map the url to the stored event for determining which group the event belongs to so we can show the correct preamble
	let eventType;
	
	// find the field the user belongs to in the event model based on their user type
	const eventGroup = eventService.getEventGroup( userType );
	// TODO: these locals bindings can be removed and the ifeq handlebars helper can be used instead.  Need to update in events.js as well
	switch( category ) {
		case 'mapp-trainings'			: eventType = 'MAPP trainings'; break;
		case 'mare-hosted-events'		: eventType = 'Mare hosted events'; break;
		case 'partner-hosted-events'	: eventType = 'partner hosted events'; break;
	}

	// store on locals for access during templating
	locals.category = category;
	locals.userType = userType;

	// fetch all data needed to render this page
	let fetchEvent					= eventService.getEventByKey( key ),
		fetchSidebarItems			= pageService.getSidebarItems(),
		fetchSocialWorkersChildren	= socialWorkerService.fetchRegisteredChildren( userId );
	
	Promise.all( [ fetchEvent, fetchSidebarItems, fetchSocialWorkersChildren ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ event, sidebarItems, registeredChildren ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;

			const isRegistrationBlocked =
				userType === 'site visitor' ? !!event.preventSiteVisitorRegistration
				: userType === 'family' ? !!event.preventFamilyRegistration
				: userType === 'social worker' ? !!event.preventSocialWorkerRegistration
				: false;

			// track whether it is an event users can register for through the site
			// admin can't register, and everyone else can only register for select types of events if registration isn't blocked in the event model
			locals.canRegister = userType !== 'admin'
				&& eventType === 'Mare hosted events'
				&& !isRegistrationBlocked;

			// only social workers can submit events, and only for specific types of events
			locals.canSubmitEvent = userType === 'social worker'
				&& eventType !== 'Mare hosted events';

			// check to see if the event spans multiple days
			const multidayEvent = event.startDate
				&& event.endDate
				&& event.startDate.getTime() !== event.endDate.getTime();

			const startDate = moment( event.startDate ).utc().format( 'dddd MMMM Do, YYYY' ),
				  endDate	= moment( event.endDate ).utc().format( 'dddd MMMM Do, YYYY' );

			// pull the date and time into a string for easier templating
			if( multidayEvent ) {
				event.displayDate = `${ startDate } to ${ endDate }`;
				event.displayDateAndTime = `${ startDate } at ${ event.startTime } to ${ endDate } at ${ event.endTime }`;
			} else {
				event.displayDate = `${ startDate }`;
				event.displayDateAndTime = `${ startDate } from ${ event.startTime } - ${ event.endTime }`;
			}
			
			// determine whether or not address information exists for the event, street1 is required, so this
			// is enough to tell us if the address has been populated
			event.hasAddress = event.address && event.address.street1;
			
			// store data on whether any attendees exist for each group
			// NOTE: used to determine whether we should render headers for each list during templating
			event.hasStaffAttendees				= event.staffAttendees.length > 0;
			event.hasFamilyAttendees			= event.familyAttendees.length > 0;
			event.hasSocialWorkerAttendees		= event.socialWorkerAttendees.length > 0;
			event.hasSiteVisitorAttendees		= event.siteVisitorAttendees.length > 0;
			event.hasChildAttendees				= event.childAttendees.length > 0;
			event.hasUnregisteredChildAttendees	= event.unregisteredChildAttendees > 0;
			event.hasUnregisteredAdultAttendees = event.unregisteredAdultAttendees > 0;

			// if the user is logged in
			if( req.user ) {
				// loop through each of the attendees in the group that matches the users type
				for( let attendee of event[ eventGroup ] ) {
					// without converting to strings, these were both evaluating to Object which didn't allow for a clean comparison
					const attendeeId = attendee._id.toString();
					const userId = req.user._id.toString();
					// determine whether the user is already attending the event
					// TODO: this was a _.forEach, which couldn't be broken out of, so we only kept checking if true wasn't found
					if( !event.attending ) {
						event.attending = attendeeId === userId;
					}
				};
			}

			// assign properties to locals for access during templating
			locals.event				= event;
			locals.isEventMissing		= _.isEmpty( event );
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			locals.displayName			= req.user ? req.user.displayName : undefined;
			locals.hasChildren			= registeredChildren.length > 0;
			locals.registeredChildren	= registeredChildren;
			locals.redirectPath			= req.url;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the event.hbs template
			view.render( 'event' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the event page - ${ err }` );	
			// render the view using the event.hbs template
			view.render( 'event' );
		});
};
