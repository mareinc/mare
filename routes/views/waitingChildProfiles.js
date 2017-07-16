var keystone		= require( 'keystone' ),
	async			= require( 'async' ),
	_				= require( 'underscore' ),
	childService	= require( '../middleware/service_child' ),
	familyService	= require( '../middleware/service_family' ),
	listsService	= require( '../middleware/service_lists' ),
	pageService		= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	let view		= new keystone.View( req, res ),
		locals		= res.locals;
	// store user type for calculating gallery permissions
	locals.userType = req.user ? req.user.get( 'userType' ) : 'anonymous';
	
	async.series( [
		done => { familyService.setGalleryPermissions( req, res, done ); },
		done => { familyService.checkForBookmarkedChildren( req, res, done ); },
		done => { listsService.getAllGenders( req, res, done ) },
		done => { listsService.getAllRaces( req, res, done ) },
		done => { listsService.getAllLanguages( req, res, done ) },
		done => { listsService.getAllDisabilities( req, res, done ) },
		done => { listsService.getAllOtherConsiderations( req, res, done ) },
		done => { listsService.getAllFamilyConstellations( req, res, done ) },
		done => { pageService.populateSidebar( req, res, done ); }

	], () => {
		// set the layout to render without the right sidebar
		locals[ 'render-with-sidebar' ] = false;
		// render the view once all the data has been retrieved
		view.render( 'waiting-child-profiles' );
	});
};
