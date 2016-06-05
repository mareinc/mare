var keystone 		= require('keystone'),
	SuccessStory 	= keystone.list('Success Story');

exports = module.exports = function(req, res) {
    'use strict';

    var view 	= new keystone.View(req, res),
    	locals 	= res.locals;

    // Fetch the success story with the matching URL
    // If it exists, pass the object into the rendering
    // If it doesn't exist, forward to a 404 page
    SuccessStory.model.find()
		.where('url', req.originalUrl)
		.exec()
		.then(function (targetStory) {

			locals.targetStory = targetStory[0];

			// Set the layout to render with the right sidebar
			locals['render-with-sidebar'] = true;
			// Render the view once all the data has been retrieved
    		view.render('success-story');

		});
};