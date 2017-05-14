const keystone		= require( 'keystone' ),
	  async			= require( 'async' ),
	  _				= require( 'underscore' ),
	  moment		= require( 'moment' ),
	  Event			= keystone.list( 'Event' ),
	  Utils			= require( '../middleware/utilities' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
    'use strict';

    let view 		= new keystone.View( req, res ),
    	locals 		= res.locals,
    	userType	= req.user ? req.user.userType : '', // Knowing the type of user visiting the page will allow us to display extra relevant information
		eventType, 		// Used to map the url to the stored event for determining which group the event belongs to so we can show the correct preamble
		targetGroup;	// Used to map to the different attendee groups to simplify searching for whether the user is attending

	switch( userType ) {
		case 'admin'			: targetGroup = 'staffAttendees'; break;
		case 'family'			: targetGroup = 'familyAttendees'; break;
		case 'social worker'	: targetGroup = 'socialWorkerAttendees'; break;
		case 'site visitor'		: targetGroup = 'siteVisitorAttendees'; break;
		default					: targetGroup = '';
	}

	// Use the URL stored in the request object to determine what event type we need to list out
	/* TODO: Handle this with the functions in Utils, similar to how the parent router is parsing the url */
	let targetList = req.originalUrl.replace( '/events/', '' );
	targetList = targetList.replace( /\/.*/, '/' );

	switch( targetList ) {
		case 'adoption-parties/'		: eventType = 'MARE adoption parties & information events'; locals.showAdoptionParties = true; break;
		case 'mapp-trainings/'			: eventType = 'MAPP trainings'; locals.showMAPPTrainings = true; break;
		case 'fundraising-events/'		: eventType = 'fundraising events'; locals.showFundraisingEvents = true; break;
		case 'agency-info-meetings/'	: eventType = 'agency information meetings'; locals.showAgencyInfoMeetings = true; break;
		case 'other-trainings/'			: eventType = 'other opportunities & trainings'; locals.showOtherTrainings = true; break;
		default							: eventType = '';
	}

	req.user = req.user || {};
	// determine if the user is an administrator. We want to display the event attendees if they are
	locals.isAdmin = req.user && req.user.userType === 'admin' ? true : false;
	// determine if the user is a social worker.  We want to allow them to create events if they are
	locals.isSocialWorker = req.user && req.user.userType === 'social worker' ? true : false;

	// track whether it is an event users can register for through the site
	locals.canRegister = eventType === 'MARE adoption parties & information events' ||
						 eventType === 'fundraising events';
	
	locals.canSubmitEvent = locals.isSocialWorker && 
							( eventType === 'MAPP trainings' ||
							  eventType === 'agency information meetings' ||
							  eventType === 'other opportunities & trainings' );

	/* TODO: Add error handling so the page doesn't hang if we can't find the event */
	async.parallel( [
		done => { // TODO: Pull this into the Event service
			Event.model.findOne()
		    	.where( 'url', req.originalUrl )
				.populate( 'contact' ) // The contact is a relationship field, so just the ID is stored.  Force the request to fetch the referenced contact model
				.populate( 'childAttendees' )
				.populate( 'familyAttendees' )
				.populate( 'socialWorkerAttendees' )
				.populate( 'siteVisitorAttendees' )
				.populate( 'staffAttendees' )
				.populate( 'address.state' )
				.exec()
				.then( event => {
					// If there are no events to display, we need to capture that information for rendering
					locals.eventMissing = _.isEmpty( event );
					// Find the target event for the current page and store the object in locals for access during templating
					locals.event = event;
					// Check to see if the event spans multiple days
					var multidayEvent = event.startDate.getTime() !== event.endDate.getTime();
					// Pull the date and time into a string for easier templating
					if( multidayEvent ) {
						event.dateTimeString = moment( event.startDate ).format( 'dddd MMMM Do, YYYY' ) + ' at ' + event.startTime + ' to ' + moment( event.endDate ).format( 'dddd MMMM Do, YYYY' ) + ' at ' + event.endTime;
					} else {
						event.dateTimeString = moment(event.startDate).format('dddd MMMM Do, YYYY') + ' from ' + event.startTime + ' - ' + event.endTime;
					}
					// Determine whether or not address information exists for the event, which is helpful during rendering
					// street1 is required, so this is enough to tell us if the address has been populated
					event.hasAddress = event.address && event.address.street1 ? true : false;
					// Store data on whether any attendees exist for the each group
					// We need this to know whether we should render headers for each list during templating
					event.hasStaffAttendees			= event.staffAttendees.length > 0 ? true : false;
					event.hasFamilyAttendees		= event.familyAttendees.length > 0 ? true : false;
					event.hasSocialWorkerAttendees	= event.socialWorkerAttendees.length > 0 ? true : false;
					event.hasSiteVisitorAttendees	= event.siteVisitorAttendees.length > 0 ? true : false;
					event.hasChildAttendees			= event.childAttendees.length > 0 ? true : false;

					_.each( event[ targetGroup ], attendee => {
						// Without converting to strings, these were both evaluating to Object which didn't allow for a clean comparison
						const attendeeID = attendee._id.toString();
						const userID = req.user._id.toString();
						// Determine whether the user is already attending the event
						// We can't break out of the _.each, so only keep checking if true wasn't found
						if( !event.attending ) {
							event.attending = attendeeID === userID ? true : false;
						}
					});

					_.each( event.familyAttendees, family => {
						// if the targetGroup is families, we need to prettify the attendee name
						const contact2Exists	= family.contact2.name.full.length > 0 ? true : false;
						const sameLastName		= family.contact1.name.last === family.contact2.name.last ? true : false;

						if( contact2Exists && sameLastName ) {
							family.fullName = family.contact1.name.first + ' and ' + family.contact2.name.full;
						} else if( contact2Exists && !sameLastName ) {
							family.fullName = family.contact1.name.full + ' and ' + family.contact2.name.full;
						} else {
							family.fullName = family.contact1.name.full;
						}
					});

					done();
				});
		},
		done => { pageService.populateSidebar( req, res, done ); }
	], () => {
		// Set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'event' );
	});
};
