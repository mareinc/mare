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
		case 'adoption-parties'			: eventType = 'MARE adoption parties & information events'; break;
		case 'mapp-trainings'			: eventType = 'MAPP trainings'; break;
		case 'fundraising-events'		: eventType = 'fundraising events'; break;
		case 'agency-info-meetings'		: eventType = 'agency information meetings'; break;
		case 'other-trainings'			: eventType = 'other opportunities & trainings'; break;
	}

	// track whether it is an event users can register for through the site
	// admin can't register, and everyone else can only register for select types of events
	locals.canRegister = userType !== 'admin' &&
						 [ 'fundraising events',
						   'MARE adoption parties & information events' ].includes( eventType );

	// only social workers can submit events, and only for specific types of events
	locals.canSubmitEvent = userType === 'social worker' &&
							[ 'MAPP trainings',
							  'agency information meetings',
							  'other opportunities & trainings' ].includes( eventType );

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

			// check to see if the event spans multiple days
			const multidayEvent = event.startDate.getTime() !== event.endDate.getTime();

			const startDate = moment( event.startDate ).format( 'dddd MMMM Do, YYYY' ),
				  endDate	= moment( event.endDate ).format( 'dddd MMMM Do, YYYY' );

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
			event.hasStaffAttendees			= event.staffAttendees.length > 0;
			event.hasFamilyAttendees		= event.familyAttendees.length > 0;
			event.hasSocialWorkerAttendees	= event.socialWorkerAttendees.length > 0;
			event.hasSiteVisitorAttendees	= event.siteVisitorAttendees.length > 0;
			event.hasChildAttendees			= event.childAttendees.length > 0;

			// if the user is logged in
			if( req.user ) {
				// loop through each of the attendees in the group that matches the users type
				for( let attendee of event[ eventGroup ] ) {
					// without converting to strings, these were both evaluating to Object which didn't allow for a clean comparison
					const attendeeID = attendee._id.toString();
					const userID = req.user._id.toString();
					// determine whether the user is already attending the event
					// TODO: this was a _.forEach, which couldn't be broken out of, so we only kept checking if true wasn't found
					if( !event.attending ) {
						event.attending = attendeeID === userID;
					}
				};
			}

			for( let family of event.familyAttendees ) {
				// if the eventGroup is families, we need to prettify the attendee name
				const hasContact2		= family.contact2.name.full.length > 0;
				const hasSameLastName	= family.contact1.name.last === family.contact2.name.last;

				if( hasContact2 && hasSameLastName ) {
					family.fullName = family.contact1.name.first + ' and ' + family.contact2.name.full;
				} else if( hasContact2 && !hasSameLastName ) {
					family.fullName = family.contact1.name.full + ' and ' + family.contact2.name.full;
				} else {
					family.fullName = family.contact1.name.full;
				}
			};

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
			console.error( `there was an error loading data for the event page - ${ err }` );	
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the event.hbs template
			view.render( 'event' );
		});
};
