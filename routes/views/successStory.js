var keystone 		= require('keystone'),
	SuccessStory	= keystone.list('Success Story'),
	_ = require('underscore');

exports = module.exports = function(req, res) {
    'use strict';

    var view 	= new keystone.View(req, res),
    	locals 	= res.locals;

    /* TODO: Change this to an async function */
    SuccessStory.model.findOne()
    	.where('url', req.originalUrl)
		.exec()
		.then(function (successStory) {
			// Find the target story for the current page and store the object in locals for access during templating
			locals.story = successStory;
			// Set the layout to render with the right sidebar
			locals['render-with-sidebar'] = true;
			// Render the view once all the data has been retrieved
			view.render('success-story');
		});
};