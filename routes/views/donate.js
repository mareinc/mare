var keystone	= require('keystone'),
	async		= require('async'),
	pageService	= require('../middleware/service_page');

exports = module.exports = function(req, res) {
    'use strict';

    var view = new keystone.View(req, res),
        locals = res.locals;

    // TODO: add code for a logged in user showing their previous donations/donation dates
	async.parallel([
		function(done) { pageService.getSectionHeader(req, res, done, 'Ways to Help'); }
	], function() {
	    // Render the view once all the data has been retrieved
	    view.render('donate');
	});
};
