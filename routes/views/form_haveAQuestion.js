const keystone		= require( 'keystone' ),
	  async			= require( 'async' ),
	  listsService	= require( '../middleware/service_lists' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 		= new keystone.View( req, res ),
		  locals 	= res.locals;
	// TODO: this async call and all others will need to be replaced once the service functions are rewritten to use native promises
	async.parallel([
		done => { pageService.populateSidebar( req, res, done ); }
	], () => {
		// set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// render the view once all the data has been retrieved
		view.render( 'form_have-a-question.hbs' );

	}, err => {

		console.log( err );
	});
};
