var keystone 	= require('keystone'),
	Event		= keystone.list('Event'),
	_ 			= require('underscore');

exports = module.exports = function(req, res) {
    'use strict';

    var view 	= new keystone.View(req, res),
    	locals 	= res.locals;

    /* TODO: Change this to an async function */
    Event.model.findOne()
    	.where('url', req.originalUrl)
		.exec()
		.then(function (event) {
			// Find the target event for the current page and store the object in locals for access during templating
			locals.story = event;
			// Set the layout to render with the right sidebar
			locals['render-with-sidebar'] = true;
			// Render the view once all the data has been retrieved
			view.render('event');
		});
};