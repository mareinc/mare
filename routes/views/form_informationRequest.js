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
	// TODO: check all these list service fetches to see which are neede for this form
	async.parallel([
		done => { listsService.getAllCitiesAndTowns( req, res, done ); },
		done => { listsService.getAllGenders( req, res, done ); },
		done => { listsService.getAllRaces( req, res, done, raceOptions ); },
		done => { listsService.getAllStates( req, res, done, stateOptions ); },
		done => { listsService.getAllWaysToHearAboutMARE( req, res, done, waysToHearOptions ); },
		done => { pageService.populateSidebar( req, res, done ); }
	], () => {
		// Set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'form_information-request.hbs' );
		
	}, err => {

		console.log( err );
	});
};
