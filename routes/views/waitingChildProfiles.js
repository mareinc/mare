var keystone		= require('keystone'),
	async			= require('async'),
	_				= require('underscore'),
	childService	= require('../middleware/service_child'),
	familyService	= require('../middleware/service_family'),
	listsService	= require('../middleware/service_lists'),
	sidebarService	= require('../middleware/service_sidebar');

exports = module.exports = function(req, res) {
	'use strict';

	var view			= new keystone.View(req, res),
		locals			= res.locals;

	// Set local variables
	locals.userType	= req.user ? req.user.get('userType') : 'anonymous';
	// Anonymous users and site users have access only to unrestricted children, registered families and social workers have access to all children
	locals.targetChildren = locals.userType === 'anonymous' || locals.userType === 'site visitor' ? 'unrestricted' : 'all';

	async.series([
		// Based on what the user is allowed to see, populate the children models into locals.children
		function(done) {
			if(locals.targetChildren === 'all') {
				childService.getAllChildren(req, res, done);
			} else {
				childService.getUnrestrictedChildren(req, res, done);
			}
		},
		function(done) { familyService.setGalleryPermissions(req, res, done); },
		function(done) { locals.canBookmarkChildren ? familyService.getBookmarkedChildren(req, res, done) : done(); },
		function(done) {
			if(locals.bookmarkedChildren && locals.bookmarkedChildren.length > 0) {
				// Loop through each child model and set a property to show they've already been bookmarked by the user during templating
				_.each(locals.children, function(child) {
					// Get the child id to compare with the array of currently bookmarked child ids
					var childId = child.get('_id');
					// Set the property for use during templating to show if the child has already been bookmarked
					child.isBookmarked = locals.bookmarkedChildren.indexOf(childId) !== -1 ? true : false;
				});

				done();

			} else {
				done();
			}
		},
		function(done) { listsService.getAllGenders(req, res, done) },
		function(done) { listsService.getAllRaces(req, res, done) },
		function(done) { listsService.getAllLanguages(req, res, done) },
		function(done) { listsService.getAllDisabilities(req, res, done) },
		function(done) { listsService.getOtherConsiderations(req, res, done) },
		function(done) { listsService.getAllFamilyConstellations(req, res, done) },
		function(done) { sidebarService.populateSidebar(req, res, done); }

	], function() {
		// Set the layout to render with the right sidebar
		locals['render-with-sidebar'] = true;
		// Render the view once all the data has been retrieved
		view.render('waiting-child-profiles');

	});

};
