const keystone					= require( 'keystone' );
	  async						= require( 'async' ),
	  listsService				= require( '../middleware/service_lists' ),
	  pageService				= require( '../middleware/service_page' ),
	  mailingListService		= require( '../middleware/service_mailing-list' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 		= new keystone.View( req, res ),
		  locals 	= res.locals;

	// objects with additional search parameters
	const stateOptions		= { default: 'Massachusetts' },
		  raceOptions		= { other: true },
		  waysToHearOptions	= { other: true };

	// fetch all the dynamic data to fill in the form dropdown and selection areas.
	async.parallel([
		done => { listsService.getChildTypesForWebsite( req, res, done ); },
		done => { listsService.getAllCitiesAndTowns( req, res, done ); },
		done => { listsService.getAllDisabilities( req, res, done ); },
		done => { listsService.getAllGenders( req, res, done ); },
		done => { listsService.getAllLanguages( req, res, done ); },
		done => { listsService.getAllLegalStatuses( req, res, done ); },
		done => { listsService.getAllOtherConsiderations( req, res, done ); },
		done => { listsService.getAllRaces( req, res, done, raceOptions ); },
		done => { listsService.getAllRegions( req, res, done ); },
		done => { listsService.getAllSocialWorkerPositions( req, res, done ); },
		done => { listsService.getAllStates( req, res, done, stateOptions ); },
		done => { listsService.getAllWaysToHearAboutMARE( req, res, done, waysToHearOptions ); },
		done => { mailingListService.getRegistrationMailingLists( req, res, done ); },
		done => { pageService.populateSidebar( req, res, done ); }
	], () => {
		// set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// render the view once all the data has been retrieved
		view.render( 'register' );

	});
};
