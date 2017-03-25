var keystone 		= require( 'keystone' ),
	async			= require( 'async' ),
	_				= require( 'underscore' ),
	MAREInTheNews	= keystone.list( 'MARE in the News' ),
	pageService		= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
    'use strict';

    var view 	= new keystone.View( req, res ),
    	locals 	= res.locals;

	/* TODO: Add error handling so the page doesn't hang if we can't find the MARE in the News story */
	async.parallel([
		done => { // TODO: Pull this function into a MARE in the News service
			MAREInTheNews.model.findOne()
		    	.where( 'url', req.originalUrl )
				.exec()
				.then( story => {
					// Find the target story for the current page and store the object in locals for access during templating
					locals.story = story;

					done();
				});
		},
		done => { pageService.populateSidebar( req, res, done ); },
		done => { pageService.getSectionHeader( req, res, done, 'Considering Adoption' ); }
	], () => {
		// Set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'mare-in-the-news' );
	});

};
