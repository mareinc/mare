var keystone	= require( 'keystone' ),
	async		= require( 'async' ),
    pageService	= require( '../middleware/service_page' );

exports = module.exports = function( req, res ) {
    'use strict';

    var view = new keystone.View(req, res),
        locals = res.locals;
    // create a container for any additional page actions to render after the content
    locals.pageActions = {};
    // create a placeholder for any buttons that may render after the content
    locals.pageActions.buttons = [];

    async.parallel([
		done => { pageService.getPageByUrl( req, res, done, req.originalUrl ); },
		done => { pageService.populateSidebar( req, res, done ); }
	], () => {
        // specify that it should render a button after the content
        locals.pageActions.hasButtons = true;
        // set the button contents
        locals.pageActions.buttons.push( { text: 'Request Adoption Information', target: '/forms/information-request-form' } );
        // Set the layout to render with the right sidebar
        locals[ 'render-with-sidebar' ] = true;
        // Render the view once all the data has been retrieved
		view.render( 'steps-in-the-process' );
	});
};
