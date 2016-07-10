var keystone 		= require('keystone'),
	async			= require('async'),
	_				= require('underscore'),
	SuccessStory	= keystone.list('Success Story'),
	sidebarService	= require('../middleware/service_sidebar');

exports = module.exports = function(req, res) {
    'use strict';

    var view 	= new keystone.View(req, res),
    	locals 	= res.locals;

	/* TODO: Add error handling so the page doesn't hang if we can't find the event */
	async.parallel([
		function(done) { // TODO: Pull this function into the success story service
			SuccessStory.model.findOne()
		    	.where('url', req.originalUrl)
				.exec()
				.then(function (successStory) {
					// Find the target story for the current page and store the object in locals for access during templating
					locals.story = successStory;

					done();
				});
		},
		function(done) { sidebarService.populateSidebar(req, res, done); }
	], function() {
		// Set the layout to render with the right sidebar
		locals['render-with-sidebar'] = true;
		// Render the view once all the data has been retrieved
		view.render('success-story');
	});

};
