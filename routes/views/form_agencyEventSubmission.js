const keystone		= require( 'keystone' );
const async			= require( 'async' );
const listsService	= require( '../middleware/service_lists' );
const pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 			= new keystone.View( req, res );

	const locals 		= res.locals;
	// objects with additional search parameters
	const stateOptions	= { default: 'Massachusetts' };

	async.parallel([
		done => { listsService.getAllStates( req, res, done, stateOptions ); },
		done => { listsService.getEventTypesForWebsite( req, res, done ); },
		done => { pageService.populateSidebar( req, res, done ); }
	], () => {
		// Set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'form_agency-event-submission.hbs' );
	}, err => {

		console.log( err );
	});
};
