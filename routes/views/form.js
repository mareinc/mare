var keystone 	= require('keystone'),
	Form 		= keystone.list('Form');

exports = module.exports = function(req, res) {
    'use strict';
    
    var view 	= new keystone.View(req, res),
    	locals 	= res.locals;

    // Fetch the page with the matching URL
    // If it exists, pass the object into the rendering
    // TODO: If it doesn't exist, forward to a 404 page
    Form.model.find()
		.where('url', req.originalUrl)
		.exec()
		.then(function (targetForm) {
			
			locals.targetForm = targetForm[0];

			// Render the view
    		view.render('form');

		});    
};