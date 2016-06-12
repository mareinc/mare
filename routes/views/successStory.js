var keystone 		= require('keystone'),
	_				= require('underscore'),
	SuccessStory	= keystone.list('Success Story'),
	Utils			= require('../middleware/utilities');

exports = module.exports = function(req, res) {
    'use strict';

    var view 	= new keystone.View(req, res),
    	locals 	= res.locals;

    /* TODO: Change this to an async function */
    SuccessStory.model.find()
		.exec()
		.then(function (successStories) {
			// Variables to hold the target success story for the page and all other stories to display in a secondary navigation
			locals.targetStory = {};
			locals.otherStories = [];

			var truncateOptions = {
				targetLength: 400,
			}

			// Loop through all success stories
			_.each(successStories, function(successStory) {
				successStory.shortContent = Utils.truncateText(successStory.content, truncateOptions);
				// Find the target story for the current page and store the object in locals.targetStory
				if(successStory.url === req.originalUrl) {
					locals.targetStory = successStory;
				// Find all other success stories and store them in locals.otherStories
				} else {
					locals.otherStories.push(successStory);
				}
			});

			// Set the layout to render with the right sidebar
			locals['render-with-sidebar'] = true;
			// Render the view once all the data has been retrieved
    		view.render('success-story');

		});
};