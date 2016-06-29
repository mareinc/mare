var keystone		= require('keystone'),
	async			= require('async'),
	Event			= keystone.list('Event');

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

/*
 *	Frontend services
 */
exports.addUser = function addUser(req, res, next) {

	var locals = res.locals,
		userId = req.user.get('_id'),
		eventId = req.body.eventId;

	async.series([
		function(done) { exports.getEventById(res, done, eventId); },
		function(done) { exports.getTargetEventGroup(req, res, done); }
	], function() {
		// Store a reference to the array of user IDs that match the current user's type
		var attendees = locals.event.get(locals.eventGroup);
		var eventGroup = locals.eventGroup;
		// Only add the user if they haven't already been saved.  This is unlikely, and would require a bad state in the system,
		// but the check has been added for an extra layer of safety
		if(attendees.indexOf(userId) === -1) {
			// Push the user to the group of users in the event that matches their userType
			attendees.push(userId);
			// Save the event
			locals.event.save();
			res.send('the user has been added successfully');
		} else {
			res.send('the user is already attending');
		}
	});
};
