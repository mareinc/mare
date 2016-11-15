var keystone				= require('keystone'),
	async					= require('async'),
	agenciesImport			= require('../middleware/data-migration-middleware/agency_model'),
	childrenImport			= require('../middleware/data-migration-middleware/child_model'),
	eventsImport			= require('../middleware/data-migration-middleware/event_model'),
	familiesImport			= require('../middleware/data-migration-middleware/family_model'),
	outsideContactImport	= require('../middleware/data-migration-middleware/outside_contact_model')
	;
	

exports = module.exports = function(req, res) {
    'use strict';

    var view = new keystone.View(req, res),
        locals = res.locals;

    async.series([
		// function(done) { outsideContactImport.importOutsideContacts(req, res, done); }
		// function(done) { agenciesImport.importAgencies(req,res,done); }
		// function(done) { childrenImport.importChildren(req, res, done); }
		function(done) { eventsImport.importFamilies(req, res, done); }
		// function(done) { familiesImport.importFamilies(req, res, done); }
		
	], function() {
		// Set the layout to render without the right sidebar
		locals['render-with-sidebar'] = false;
		locals['render-without-header'] = true;
		// Render the view once all the data has been retrieved
		view.render('data-migration-output');

	});

};
