const keystone 	    = require( 'keystone' ),
	  async		    = require( 'async' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = function( req, res ) {
    'use strict';

    let view 	= new keystone.View( req, res ),
        locals 	= res.locals;
    // create a container for any additional page actions to render after the content
    locals.pageActions = {};
    // create a placeholder for any buttons that may render after the content
    locals.pageActions.buttons = [];

    // fetch the page with the matching URL
    // if it exists, pass the object into the rendering
    // TODO: If it doesn't exist, forward to a 404 page

    async.parallel([
		done => { pageService.getPageByUrl(req, res, done, req.originalUrl); },
		done => { pageService.populateSidebar(req, res, done); }
	], () => {
        // set the layout to render with the right sidebar
        locals[ 'render-with-sidebar' ] = true;
        // if the user requested the 'Register a child' page, specify that it should render a button after the content
        if( locals.targetPage.get( 'key' ) === 'register-a-child' ) {
            locals.pageActions.hasButtons = true;
            // set the button contents
            locals.pageActions.buttons.push( { text: 'Register a Child', target: '/forms/child-registration-form' } );
        // otherwise, if the user requested the 'Register a family' page, specify that it should render a button after the content
        } else if( locals.targetPage.get( 'key' ) === 'register-a-family' ) {
            locals.pageActions.hasButtons = true;
            // set the button contents
            locals.pageActions.buttons.push( { text: 'Register a Family', target: '/forms/family-registration-form' } );
        }
        // render the view once all the data has been retrieved
		view.render( 'page' );

	});
};
