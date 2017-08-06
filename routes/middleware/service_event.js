var keystone	= require( 'keystone' ),
	async		= require( 'async' ),
	moment		= require( 'moment' ),
	Event		= keystone.list( 'Event' ),
	Utils		= require( './utilities' );

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
		case 'admin'			: locals.eventGroup = 'staffAttendees'; break;
		case 'social worker'	: locals.eventGroup = 'socialWorkerAttendees'; break;
		case 'site visitor'		: locals.eventGroup = 'siteVisitorAttendees'; break;
		case 'family'			: locals.eventGroup = 'familyAttendees';
	}

	done();
}
/* fetches a random event for the sidebar, which has restrictions as to what can be shown */
exports.getRandomEvent = function getRandomEvent(req, res, done) {

	let locals = res.locals;

	// TODO: Handle the error if we get one
	Event.model.findRandom({
			type: { $in: [ 'MARE adoption parties & information events', 'fundraising events' ] },
			isActive: true
		}, ( err, event ) => {

			locals.randomEvent = event ? event[ 0 ] : {};
			// Create a formatted date for display in the UI
			locals.randomEvent.prettyDate = moment( locals.randomEvent.date ).format( 'dddd, MMMM Do' );
			// remove HTML tags from the description
			// NOTE: if this needs to be used for more than just the sidebar, we may need to relocate the call or create additional truncated text variants
			// set how the text will be truncated for short content displays
			const truncateOptions = { targetLength: 100 };
			// create a truncated content element for a nicer display in summary cards
			locals.randomEvent.shortDescription = Utils.truncateText( Utils.stripTags( locals.randomEvent.description ), truncateOptions );
			// Execute done function if async is used to continue the flow of execution
			done();
		});

};

/*
 *	frontend services
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
};

/* event creation submitted through the agency event submission form */
exports.submitEvent = function submitEvent( req, res, next ) {

	const locals	= res.locals;
	const event		= req.body;
	// attempt to create an event
	var isEventCreated = new Promise( ( resolve, reject ) => {
		exports.createEvent( locals, event, resolve, reject );
	});
	// if we're successful in creating it
	isEventCreated.then( result => {
		// create a success flash message
		req.flash( 'success', {
					title: 'Your event has been submitted',
					detail: 'once your event has been approved by the MARE staff, you will receive a notification email.  If you don\'t receive an email within 5 business days, please contact [some mare contact] for a status update.'} );
		// reload the form to display the flash message
		res.redirect( '/forms/agency-event-submission-form' );
	});
	// if we're not successful in creating it
	isEventCreated.catch( error => {
		// create an error flash message
		req.flash( 'error', {
					title: 'Something went wrong while creating your event.',
					detail: 'We are looking into the issue and will email a status update once it\'s resolved' } );
		// reload the form to display the flash message
		res.redirect( '/forms/agency-event-submission-form' );	
	});

};
// create and save a new event model
exports.createEvent = function createEvent( locals, event, resolve, reject ) {
	// create a new event using the form data we received
	const newEvent = new Event.model({

		name: event.name,
		type: event.eventType,	
		address: {
			street1: event.street1,
			street2: event.street2,
			city: event.city,
			state: event.state,
			zipCode: event.zipCode
		},
		contactEmail: event.contactEmail,
		startDate: event.startDate,
		startTime: event.startTime,
		endDate: event.endDate,
		endTime: event.endTime,
		description: event.description,
		isActive: false,
		createdViaWebsite: true

	});

	newEvent.save( err => {
		// if the event was created successfully, resolve the event creation promise
		resolve();

	}, err => {
		// if there was an error saving the event, reject the event creation promise
		console.log( err );
		reject();
	});
};