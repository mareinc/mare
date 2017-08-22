const keystone		= require( 'keystone' ),
	  _				= require( 'underscore' ),
	  moment		= require( 'moment' ),
	  eventService	= require( '../middleware/service_event' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view 		= new keystone.View( req, res ),
    	  locals 	= res.locals,
    	  userType	= req.user ? req.user.userType : ''; // knowing the type of user visiting the page will allow us to display extra relevant information
	// extract request object parameters into local constants
	const { category, key } = req.params;

	// used to map the url to the stored event for determining which group the event belongs to so we can show the correct preamble
	let eventType;
	
	// find the field the user belongs to in the event model based on their user type
	const eventGroup = eventService.getEventGroup( userType );
	// TODO: these locals bindings can be removed and the ifeq handlebars helper can be used instead.  Need to update in eventList.js as well
	switch( category ) {
		case 'adoption-parties'			: eventType = 'MARE adoption parties & information events'; locals.showAdoptionParties = true; break;
		case 'mapp-trainings'			: eventType = 'MAPP trainings'; locals.showMAPPTrainings = true; break;
		case 'fundraising-events'		: eventType = 'fundraising events'; locals.showFundraisingEvents = true; break;
		case 'agency-info-meetings'		: eventType = 'agency information meetings'; locals.showAgencyInfoMeetings = true; break;
		case 'other-trainings'			: eventType = 'other opportunities & trainings'; locals.showOtherTrainings = true; break;
		default							: eventType = ''; /* TODO: test this to see if it's needed or if it messes everything up with a bad url.  Most likely need to redirect or show an error page.  Check eventList.js as well */
	}

	// determine if the user is an administrator. We want to display the event attendees if they are
	locals.isAdmin = userType === 'admin';
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
	let fetchEvent			= eventService.getEventByKey( key ),
		fetchSidebarItems	= pageService.getSidebarItems();
	
	Promise.all( [ fetchEvent, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ event, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;

			// check to see if the event spans multiple days
			const multidayEvent = event.startDate.getTime() !== event.endDate.getTime();
			// pull the date and time into a string for easier templating
			if( multidayEvent ) {
				event.dateTimeString = `${ moment( event.startDate ).format( 'dddd MMMM Do, YYYY' ) } at ${ event.startTime } to ${ moment( event.endDate ).format( 'dddd MMMM Do, YYYY' ) } at ${ event.endTime }`;
			} else {
				event.dateTimeString = `${ moment( event.startDate ).format( 'dddd MMMM Do, YYYY' ) } from ${ event.startTime } - ${ event.endTime }`;
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

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the event.hbs template
			view.render( 'event' );
		})
		.catch( () => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the event page` );	
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the event.hbs template
			view.render( 'event' );
		});
};
