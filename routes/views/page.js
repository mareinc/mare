var keystone 	= require('keystone'),
	async		= require('async'),
	pageService	= require('../middleware/service_page');

exports = module.exports = function(req, res) {
    'use strict';

    var view 	= new keystone.View(req, res),
    	locals 	= res.locals;

    // Fetch the page with the matching URL
    // If it exists, pass the object into the rendering
    // TODO: If it doesn't exist, forward to a 404 page

    async.parallel([
		function(done) { pageService.getPageByUrl(req, res, done, req.originalUrl); },
	], function() {

		view.render('page');

	});
};