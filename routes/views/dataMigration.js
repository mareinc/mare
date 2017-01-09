const keystone					= require( 'keystone' );
const async						= require( 'async' );
const agenciesImport			= require( '../middleware/data-migration-middleware/import-agencies' );
const childrenImport			= require( '../middleware/data-migration-middleware/import-children' );
const eventsImport				= require( '../middleware/data-migration-middleware/import-events' );
const inquiriesExtranetImport	= require( '../middleware/data-migration-middleware/import-inquiries-extranet' );
const inquiriesCallImport		= require( '../middleware/data-migration-middleware/import-inquiries-calls');
const internalNotesImport		= require( '../middleware/data-migration-middleware/import-internal-notes' );
const familiesImport			= require( '../middleware/data-migration-middleware/import-families' );
const mailingListsImport    	= require( '../middleware/data-migration-middleware/import-mailing-lists');
const placementsImport			= require( '../middleware/data-migration-middleware/import-placements' );
const outsideContactImport		= require( '../middleware/data-migration-middleware/import-outside-contacts' );
const socialWorkerImport		= require( '../middleware/data-migration-middleware/import-social-workers' );
// id mappings between systems
const statesMap					= require( '../middleware/data-migration-maps/state' );
const regionsMap				= require( '../middleware/data-migration-maps/region' );
const outsideContactGroupsMap	= require( '../middleware/data-migration-maps/outside-contact-group' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view = new keystone.View( req, res );

    const locals = res.locals;
	// create a namespace for all migration data needed for the import
	// this makes clearing memory much easier
	locals.migration = locals.migration || {
		maps: {},
		data: {}
	};

    async.series([
		done => { statesMap.getStatesMap(req, res, done); },
		done => { regionsMap.getRegionsMap( req, res, done ); },
		done => { outsideContactGroupsMap.getOutsideContactGroupsMap( req, res, done ) },
		done => { agenciesImport.importAgencies( req, res, done ); },
		// done => { outsideContactImport.importOutsideContacts( req, res, done ); },
		// done => { socialWorkerImport.importSocialWorkers( req, res, done ); },
		// done => { childrenImport.importChildren( req, res, done ); },
		// done => { familiesImport.importFamilies( req, res, done ); },
		// done => { placementsImport.importPlacements( req, res, done ); },
		// done => { inquiriesExtranetImport.importInquiries( req, res, done ); },
		// done => { inquiriesCallImport.importInquiries( req, res, done ); },
		// done => { eventsImport.importEvents( req, res, done ); },
		// done => { mailingListsImport.importMailingLists( req, res, done ); },
		// done => { internalNotesImport.importInternalNotes( req, res, done ); },
		
	], () => {
		// Set the layout to render without the right sidebar
		locals[ 'render-with-sidebar' ] = false;
		locals[ 'render-without-header' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'data-migration-output' );

	});

};
