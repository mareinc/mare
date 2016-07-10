var keystone 		= require('keystone'),
	async			= require('async'),
	_				= require('underscore'),
	Event			= keystone.list('Event'),
	Utils			= require('../middleware/utilities'),
	sidebarService	= require('../middleware/service_sidebar');

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
		case 'adoption-parties/'		: eventType = 'MARE adoption parties & information events'; locals.showAdoptionParties = true; break;
		case 'mapp-trainings/'			: eventType = 'MAPP trainings'; locals.showMAPPTrainings = true; break;
		case 'fundraising-events/'		: eventType = 'fundraising events'; locals.showFundraisingEvents = true; break;
		case 'agency-info-meetings/'	: eventType = 'agency information meetings'; locals.showAgencyInfoMeetings = true; break;
		case 'other-trainings/'			: eventType = 'other opportunities & trainings'; locals.showOtherTrainings = true; break;
		default							: eventType = '';
	}

	async.parallel([
		function(done) { // TODO: Pull this into the Event service
			Event.model.find()
				.where('type', eventType) // Grab only the events matching the target category
				.where('isActive', true) // We don't want to show inactive events
				.populate(targetGroup)
				.populate('address.state')
				.exec()
				.then(function (events) {
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
						// street1 is required, so this is enough to tell us if the address has been populated
						event.hasAddress = event.address && event.address.street1 ? true : false;

						_.each(event[targetGroup], function(attendee) {
							// Without converting to strings, these were both evaluating to Object which didn't allow for a clean comparison
							var attendeeID	= attendee._id.toString(),
								userID		= req.user._id.toString();

							// Determine whether the user has already attended the event
							event.attended = attendeeID === userID ? true : false;
						});

						// Store all events in an array on locals to expose them during templating
						locals.events.push(event);
					});

					done();

				});
		},
		function(done) { sidebarService.populateSidebar(req, res, done); }
	], function() {
		// Set the layout to render with the right sidebar
		locals['render-with-sidebar'] = true;
		// Render the view once all the data has been retrieved
		view.render('eventList');
	});
};
