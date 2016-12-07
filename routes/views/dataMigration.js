const keystone				= require( 'keystone' );
const async					= require( 'async' );
const agenciesImport		= require( '../middleware/data-migration-middleware/agency_model' );
const childrenImport		= require( '../middleware/data-migration-middleware/child_model' );
const eventsImport			= require( '../middleware/data-migration-middleware/event_model' );
const familiesImport		= require( '../middleware/data-migration-middleware/family_model' );
const outsideContactImport	= require( '../middleware/data-migration-middleware/outside_contact_model' );
	

exports = module.exports = function(req, res) {
    'use strict';

    const view = new keystone.View( req, res );

    let locals = res.locals;

    async.series([
		// function(done) { outsideContactImport.importOutsideContacts( req, res, done ); },
		function(done) { agenciesImport.importAgencies( req, res, done ); },
		// function(done) { childrenImport.importChildren( req, res, done ); },
		// function(done) { familiesImport.importFamilies( req, res, done ); },
		// function(done) { eventsImport.importEvents( req, res, done ); }
		
	], function() {
		// Set the layout to render without the right sidebar
		locals[ 'render-with-sidebar' ] = false;
		locals[ 'render-without-header' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'data-migration-output' );

	});

};
