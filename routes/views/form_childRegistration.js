const keystone		= require( 'keystone' );
const async			= require( 'async' );
const listsService	= require( '../middleware/service_lists' );
const pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 				= new keystone.View( req, res );

	const locals 			= res.locals;
	// objects with additional search parameters
	const raceOptions		= { other: true };
	// fetch all needed data prior to rendering
	async.parallel([
		done => { listsService.getAllCitiesAndTowns( req, res, done ); },
		done => { listsService.getAllDisabilities( req, res, done ); },
		done => { listsService.getAllStates( req, res, done ); },
		done => { listsService.getAllRaces( req, res, done, raceOptions ) },
		done => { listsService.getAllResidences( req, res, done ); },
		done => { listsService.getAllFamilyConstellations( req, res, done ); },
		done => { listsService.getAllGenders( req, res, done ); },
		done => { listsService.getAllLanguages( req, res, done ); },
		done => { listsService.getAllLegalStatuses( req, res, done ); },
		done => { listsService.getAllOtherConsiderations( req, res, done ); },
		done => { listsService.getAllOtherFamilyConstellationConsiderations( req, res, done ); },
		done => { pageService.populateSidebar( req, res, done ); }
	], () => {
		// Set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'form_social-worker-child-registration.hbs' );
		
	}, err => {

		console.log( err );
	});
};
