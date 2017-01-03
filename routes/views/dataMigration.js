const keystone				= require( 'keystone' );
const async					= require( 'async' );
const agenciesImport		= require( '../middleware/data-migration-middleware/agency_model' );
const childrenImport		= require( '../middleware/data-migration-middleware/child_model' );
const eventsImport			= require( '../middleware/data-migration-middleware/event_model' );
const inquiriesImport		= require( '../middleware/data-migration-middleware/inqury_model' );
const internalNotesImport	= require( '../middleware/data-migration-middleware/internal_note_model' );
const familiesImport		= require( '../middleware/data-migration-middleware/family_model' );
const mailingListsImport    = require( '../middleware/data-migration-middleware/mailing_list_model');
const placementsImport		= require( '../middleware/data-migration-middleware/placement_model' );
const outsideContactImport	= require( '../middleware/data-migration-middleware/outside_contact_model' );
const socialWorkerImport	= require( '../middleware/data-migration-middleware/user_socialworker_model' );
// id mappings between systems
const statesMap				= require( '../middleware/data-migration-maps/state' );
	

exports = module.exports = function(req, res) {
    'use strict';

    const view = new keystone.View( req, res );

    let locals = res.locals;

    async.series([
		done => { statesMap.getStatesMap(req, res, done) },
		// done => { agenciesImport.importAgencies( req, res, done ); }, 			   // 1
		// done => { outsideContactImport.importOutsideContacts( req, res, done ); }   // 2
		// done => { socialWorkerImport.importSocialWorker( req, res, done ); }        // 3
		// done => { childrenImport.importChildren( req, res, done ); },			   // 4
		done => { familiesImport.importFamilies( req, res, done ); },			   // 5
		// done => { placementsImport.importPlacements( req, res, done ); },		   // 6
		// done => { inquiriesImport.importInquiries( req, res, done ); },		       // 7
		// done => { eventsImport.importEvents( req, res, done ); }					   // 8
		// done => { mailingListsImport.importMailingLists( req, res, done ); }		   // 9
		// done => { internalNotesImport.importInternalNotes( req, res, done ); }	   // 10
		
	], function() {
		// Set the layout to render without the right sidebar
		locals[ 'render-with-sidebar' ] = false;
		locals[ 'render-without-header' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'data-migration-output' );

	});

};
