var keystone 	= require('keystone'),
	Event 		= keystone.list('Event');

exports = module.exports = function(req, res) {
    'use strict';
    
    var view 	= new keystone.View(req, res),
    	locals 	= res.locals;

    // Fetch the event with the matching URL
    // If it exists, pass the object into the rendering
    // If it doesn't exist, forward to a 404 page
    Event.model.find()
		.where('url', req.originalUrl)
		.populate('type')
		.exec()
		.then(function (targetEvent) {
			
			locals.targetEvent = targetEvent[0];

			// Render the view
    		view.render('event');

		});    
};