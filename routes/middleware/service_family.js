var keystone		= require('keystone'),
	async			= require('async'),
	User			= keystone.list('User'),
	Family			= keystone.list('Family'),
	Child			= keystone.list('Child'),
	childService	= require('./service_child'),
	userService		= require('./service_user');

exports.setGalleryPermissions = function setGalleryPermissions(req, res, done) {

	var locals		= res.locals,
		userType	= locals.userType;

	locals.canBookmarkChildren = userType === 'social worker' || userType === 'family' ? true : false;
	locals.canSearchForChildren = userType === 'social worker' || userType === 'family' ? true : false;

	done();
};

/* If the user type is capable of bookmarking children on the site, retrieve any that are already bookmarked */
exports.getBookmarkedChildren = function getBookmarkedChildren(req, res, done) {

	var locals = res.locals;

	// Fetch the user if it has already been retrieved
	if(locals.user === undefined) {

		var userId = req.user.get('_id');

		async.series([
			function(done) { userService.getUserById(req, res, done, userId); }
		], function() {

			locals.bookmarkedChildren = locals.user.get('bookmarkedChildren');
			// execute done function if async is used to continue the flow of execution
			// TODO: if this is used in non-async middleware, done or next should be passed into options and the appropriate one should be executed
			done();

		});

	} else {

		locals.bookmarkedChildren = locals.user.get('bookmarkedChildren');

		done();
	}

};

/*
 *	Frontend services
 */
exports.addChildBookmark = function addChildBookmark(req, res, next) {

	var locals = res.locals;
		userId = req.user.get('_id');
		registrationNumber = req.body.registrationNumber;

	async.parallel([
		function(done) { childService.getChildByRegistrationNumber(req, res, done, registrationNumber); },
		function(done) { userService.getUserById(req, res, done, userId); }
	], function() {

		var childId				= locals.child.get('_id'),
			bookmarkedChildren	= locals.user.get('bookmarkedChildren');
		// Only add the bookmark if it hasn't already been saved.  This is unlikely, and would require a bad state in the system,
		// but the check has been added for an extra layer of safety
		if(bookmarkedChildren.indexOf(childId) === -1) {
			bookmarkedChildren.push(childId);
		}

		locals.user.update({ bookmarkedChildren: bookmarkedChildren }, { multi: false }, function (err, raw) {
			if (err) {
				console.log(err);
			}

			res.send('bookmark added');

		});
	});
};

exports.removeChildBookmark = function removeChildBookmark(req, res, next) {
	var locals = res.locals;
		userId = req.user.get('_id');
		registrationNumber = req.body.registrationNumber;

	async.parallel([
		function(done) { childService.getChildByRegistrationNumber(req, res, done, registrationNumber); },
		function(done) { userService.getUserById(req, res, done, userId); }
	], function() {

		var childId				= locals.child.get('_id'),
			bookmarkedChildren	= locals.user.get('bookmarkedChildren'),
			bookmarkIndex		= bookmarkedChildren.indexOf(childId);
		// Only remove the bookmark if it has already been saved.  This is unlikely, and would require a bad state in the system,
		// but the check has been added for an extra layer of safety
		if(bookmarkedChildren.indexOf(childId) !== -1) {
			bookmarkedChildren.splice(bookmarkIndex, 1);
		}

		locals.user.update({ bookmarkedChildren: bookmarkedChildren }, { multi: false }, function (err, raw) {
			if (err) {
				console.log(err);
			}

			res.send('bookmark added');

		});
	});
};
