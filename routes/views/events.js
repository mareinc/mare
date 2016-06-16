var keystone 	= require('keystone'),
	_			= require('underscore'),
	Event		= keystone.list('Event'),
	Utils		= require('../middleware/utilities');

exports = module.exports = function(req, res) {
    'use strict';

    var view 	= new keystone.View(req, res),
    	locals 	= res.locals;

    /* TODO: Change this to an async function */
    Event.model.find()
		.exec()
		.then(function (events) {
			// An array to hold all events
			locals.events = [];

			var truncateOptions = {
				targetLength: 400,
			}

			// Loop through all events
			_.each(events, function(event) {
				event.shortContent = Utils.truncateText(event.content, truncateOptions);
				// Store all events in an array on locals to expose them during templating
				locals.events.push(event);
			});

			// Set the layout to render with the right sidebar
			locals['render-with-sidebar'] = true;
			// Render the view once all the data has been retrieved
    		view.render('events');

		});
};