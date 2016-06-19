var keystone 	= require('keystone'),
	_			= require('underscore'),
	Event		= keystone.list('Event'),
	Utils		= require('../middleware/utilities');

exports = module.exports = function(req, res) {
	'use strict';

	var view		= new keystone.View(req, res),
		locals		= res.locals,
		userType	= req.user ? req.user.userType : '', // Knowing the type of user visiting the page will allow us to display extra relevant information
		eventType, 		// Used to map the url to the stored event for determining which subset of events to show
		targetGroup;	// Used to map to the different attendee groups to simplify searching for whether the user is attending

	switch(userType) {
		case 'admin'			: targetGroup = 'cscAttendees'; break;
		case 'family'			: targetGroup = 'familyAttendees'; break;
		case 'social worker'	: targetGroup = 'socialWorkerAttendees'; break;
		case 'site visitor'		: targetGroup = 'siteVisitorAttendees'; break;
		default					: targetGroup = '';
	}

	// Use the URL stored in the request object to determine what event type we need to list out
	var targetList = req.originalUrl.replace('/events/', '');

	switch(targetList) {
		case 'adoption-parties'		: eventType = 'MARE adoption parties & information events'; locals.showAdoptionParties = true; break;
		case 'mapp-trainings'		: eventType = 'MAPP trainings'; locals.showMAPPTrainings = true; break;
		case 'fundraising-events'	: eventType = 'fundraising events'; locals.showFundraisingEvents = true; break;
		case 'agency-info-meetings'	: eventType = 'agency information meetings'; locals.showAgencyInfoMeetings = true; break;
		case 'other-trainings'		: eventType = 'other opportunities & trainings'; locals.showOtherTrainings = true; break;
		default						: eventType = '';
	}

	// If we don't recognize the event type, reroute the user back to the event categories page
	if(eventType.length === 0) {
		app.get('/events');
	}

	/* TODO: Change this to an async function */
	Event.model.find()
		.where('type', eventType) // Grab only the events matching the target category
		.where('isActive', true) // We don't want to show inactive events
		.populate('contact') // The contact is a relationship field, so just the ID is stored.  Force the request to fetch the referenced contact model
		.populate('childAttendees')
		.populate('familyAttendees')
		.populate('socialWorkerAttendees')
		.populate('siteVisitorAttendees')
		.populate('cscAttendees')
		.populate('address.state')
		.exec()
		.then(function (events) {
			// Determine if the user is an administrator. We want to display the event attendees if they are
			req.user = req.user || {};
			locals.isAdmin = req.user && req.user.userType === 'admin' ? true : false;
			// If there are no events to display, we need to capture that information for rendering
			locals.noEvents = events.length > 0 ? false : true;
			// An array to hold all events for use during templating
			locals.events = [];
			// A set of options to define how truncation will be handled
			var truncateOptions = {
				targetLength: 400
			}

			// Loop through all events
			_.each(events, function(event) {
				// The list page needs truncated details information to keep the cards they're displayed on small
				event.shortContent = Utils.truncateText(event.description, truncateOptions);
				// Determine whether or not address information exists for the event, which is helpful during rendering
				event.hasAddress = event.address && event.address.street1 ? true : false;
				// Store data on whether any attendees exist for the each group
				// We need this to know whether we should render headers for each list during templating
				event.hasCSCAttendees			= event.cscAttendees.length > 0 ? true : false;
				event.hasFamilyAttendees		= event.familyAttendees.length > 0 ? true : false;
				event.hasSocialWorkerAttendees	= event.socialWorkerAttendees.length > 0 ? true : false;
				event.hasSiteVisitorAttendees	= event.siteVisitorAttendees.length > 0 ? true : false;
				event.hasChildAttendees			= event.childAttendees.length > 0 ? true : false;

				_.each(event[targetGroup], function(attendee) {
					// Without converting to strings, these were both evaluating to Object which didn't allow for a clean comparison
					var attendeeID = attendee._id.toString();
					var userID = req.user._id.toString();
					// Determine whether the user has already attended the event
					event.attended = attendeeID === userID ? true : false;
				});

				_.each(event.familyAttendees, function(family) {
					// if the targetGroup is families, we need to prettify the attendee name
					var contact2Exists = family.contact2.name.full.length > 0 ? true : false;
					var sameLastName = family.contact1.name.last === family.contact2.name.last ? true : false;

					if(contact2Exists && sameLastName) {
						family.fullName = family.contact1.name.first + ' and ' + family.contact2.name.full;
					} else if(contact2Exists && !sameLastName) {
						family.fullName = family.contact1.name.full + ' and ' + family.contact2.name.full;
					} else {
						family.fullName = family.contact1.name.full;
					}
				});
				console.log(event);

				// Store all events in an array on locals to expose them during templating
				locals.events.push(event);
			});

			// Set the layout to render with the right sidebar
			locals['render-with-sidebar'] = true;
			// Render the view once all the data has been retrieved
			view.render('eventList');

		});
};