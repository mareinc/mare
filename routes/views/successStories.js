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
			// An array to hold all success stories
			locals.stories = [];

			var truncateOptions = {
				targetLength: 400
			}

			// Loop through all success stories
			_.each(successStories, function(successStory) {
				successStory.shortContent = Utils.truncateText(successStory.content, truncateOptions);
				// Store all success stories in an array on locals to expose them during templating
				locals.stories.push(successStory);
			});

			// Set the layout to render with the right sidebar
			locals['render-with-sidebar'] = true;
			// Render the view once all the data has been retrieved
    		view.render('success-stories');

		});
};