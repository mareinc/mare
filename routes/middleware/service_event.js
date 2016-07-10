var keystone	= require('keystone'),
	async		= require('async'),
	moment		= require('moment'),
	Event		= keystone.list('Event');

exports.getEventById = function getEventById(res, done, eventId) {

	var locals = res.locals;

	Event.model.findById(eventId)
				.exec()
				.then(function (event) {

					locals.event = event;
					// execute done function if async is used to continue the flow of execution
					done();

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getTargetEventGroup = function getTargetEventGroup(req, res, done) {

	var locals = res.locals;

	switch(req.user.userType) {
		case 'admin'			: locals.eventGroup = 'cscAttendees'; break;
		case 'social worker'	: locals.eventGroup = 'socialWorkerAttendees'; break;
		case 'site visitor'		: locals.eventGroup = 'siteVisitorAttendees'; break;
		case 'family'			: locals.eventGroup = 'familyAttendees';
	}

	done();
}

exports.getRandomEvent = function getRandomEvent(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	// TODO: Handle the error if we get one
	Event.model.findRandom(function(err, event){
		// Create a formatted date for display in the UI
		event.prettyDate = moment(event.date).format('dddd, MMMM Do');

		locals.randomEvent = event;
		// Execute done function if async is used to continue the flow of execution
		done();
	});

};

/*
 *	Frontend services
 */
exports.addUser = function addUser(req, res, next) {
	var locals = res.locals,
		userId = req.user.get('_id'),
		userName = req.user.get('name.full'),
		userType = req.user.get('userType'),
		eventId = req.body.eventId;

	async.series([
		function(done) { exports.getEventById(res, done, eventId); },
		function(done) { exports.getTargetEventGroup(req, res, done); }
	], function() {
		// Store a reference to the array of user IDs that match the current user's type
		var eventGroup	= locals.eventGroup,
			attendees	= locals.event.get(eventGroup),
			userIndex	= attendees.indexOf(userId);
		// Only add the user if they haven't already been saved.  This is unlikely, and would require a bad state in the system,
		// but the check has been added for an extra layer of safety
		if(userIndex === -1) {
			// Push the user to the group of users in the event that matches their userType
			attendees.push(userId);
			// Save the event
			locals.event.save();
			// Construct useful data for needed UI updates
			var responseData = {
				success: true,
				action: 'register',
				name: userName,
				group: userType
			};
			// TODO: Consider changing this and all other JSON responses to res.json for added durability
			res.send(JSON.stringify(responseData));

		} else {

			var responseData = {
				success: false,
				action: 'register',
				message: 'You are already attending that event'
			};

			res.send(JSON.stringify(responseData));
		}
	});
};

exports.removeUser = function removeUser(req, res, next) {

	var locals = res.locals,
		userId = req.user.get('_id'),
		userName = req.user.get('name.full'),
		userType = req.user.get('userType'),
		eventId = req.body.eventId;

	async.series([
		function(done) { exports.getEventById(res, done, eventId); },
		function(done) { exports.getTargetEventGroup(req, res, done); }
	], function() {
		// Store a reference to the array of user IDs that match the current user's type
		var eventGroup	= locals.eventGroup,
			attendees	= locals.event.get(eventGroup),
			userIndex	= attendees.indexOf(userId);
		// Only remove the user if they are attending.  This is unlikely, and would require a bad state in the system,
		// but the check has been added for an extra layer of safety
		if(userIndex !== -1) {
			// Remove the user from the group of users in the event that matches their userType
			attendees.splice(userIndex, 1);
			// Save the event
			locals.event.save();
			// Construct useful data for needed UI updates
			var responseData = {
				success: true,
				action: 'unregister',
				name: userName,
				group: userType
			};
			// TODO: Consider changing this and all other JSON responses to res.json for added durability
			res.send(JSON.stringify(responseData));
		} else {
			var responseData = {
				success: false,
				action: 'unregister',
				message: 'You have already been removed from that event'
			};

			res.send(JSON.stringify(responseData));
		}
	});
}
