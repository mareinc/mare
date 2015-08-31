var keystone 	= require('keystone'),
	Page 		= keystone.list('Page');

exports = module.exports = function(req, res) {
    'use strict';
    
    var view 	= new keystone.View(req, res),
    	locals 	= res.locals;

    // Fetch the page with the matching URL
    // If it exists, pass the object into the rendering
    // If it doesn't exist, forward to a 404 page
    Page.model.find()
		.where('url', req.originalUrl)
		.exec()
		.then(function (targetPage) {
			
			locals.targetPage = targetPage[0];

			// Render the view
    		view.render('page');

		});    
};