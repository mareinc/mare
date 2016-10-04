var keystone				= require('keystone'),
	async					= require('async'),
	dataMigrationService	= require('../middleware/service_data-migration');

exports = module.exports = function(req, res) {
    'use strict';

    var view = new keystone.View(req, res),
        locals = res.locals;

    async.parallel([
		// function(done) { dataMigrationService.migrateChildren(req, res, done); }
		function(done) { done() }
	], function() {
		// Set the layout to render without the right sidebar
		locals['render-with-sidebar'] = false;
		locals['render-without-header'] = true;
		// Render the view once all the data has been retrieved
		view.render('data-migration-output');

	});

};
