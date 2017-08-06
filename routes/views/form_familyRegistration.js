const keystone		= require( 'keystone' );
const async			= require( 'async' );
const listsService	= require( '../middleware/service_lists' );
const pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 				= new keystone.View( req, res );
	const locals 			= res.locals;

	// objects with additional search parameters
	const stateOptions		= { default: 'Massachusetts' };
	const raceOptions		= { other: true };
	const waysToHearOptions	= { other: true };
	// fetch all needed data prior to rendering
	async.parallel([
		done => { listsService.getAllCitiesAndTowns( req, res, done ); },
		done => { listsService.getAllDisabilities( req, res, done ); },
		done => { listsService.getAllStates( req, res, done, stateOptions ); },
		done => { listsService.getAllRaces( req, res, done, raceOptions ); },
		done => { listsService.getAllGenders( req, res, done ); },
		done => { listsService.getAllLanguages( req, res, done ); },
		done => { listsService.getAllLegalStatuses( req, res, done ); },
		done => { listsService.getAllOtherConsiderations( req, res, done ); },
		done => { listsService.getChildTypesForWebsite( req, res, done ); },
		done => { pageService.populateSidebar( req, res, done ); }
	], () => {
		// set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// render the view once all the data has been retrieved
		view.render( 'form_social-worker-family-registration.hbs' );
		
	}, err => {

		console.log( err );
	});
};
