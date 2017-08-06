const keystone 	    = require( 'keystone' ),
	  async		    = require( 'async' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = function( req, res ) {
    'use strict';

    let view 	= new keystone.View( req, res ),
        locals 	= res.locals;
    // create a container for any additional page actions to render after the content
    locals.pageActions = {};
    // create a placeholder for any buttons that may render in a button group after the content
    locals.pageActions.buttons = [];
    // create a placeholder for any sections that may render after the content
    locals.pageActions.sections = [];

    // fetch the page with the matching URL
    // if it exists, pass the object into the rendering
    // TODO: If it doesn't exist, forward to a 404 page

    async.parallel([
		done => { pageService.getPageByUrl(req, res, done, req.originalUrl); },
		done => { pageService.populateSidebar(req, res, done); }
	], () => {
        // set the layout to render with the right sidebar
        locals[ 'render-with-sidebar' ] = true;
        // if the user requested the 'Register a child' page
        if( locals.targetPage.get( 'key' ) === 'register-a-child' ) {
            // if the user is logged in as a social worker
            if( locals.user && locals.user.userType === 'social worker' ) {
                // specify that it should render a button after the content
                locals.pageActions.hasButtons = true;
                // set the button contents
                locals.pageActions.buttons.push( { text: 'Register a Child', target: '/forms/child-registration-form' } );
            // if the user is not a logged in social worker
            } else {
                // set the section contents
                locals.pageActions.sections.push( `You must be logged in as a social worker to register a child.  If you're a social worker, you can <a href="/register#social-worker">register here</a>.` );
            }
        // otherwise, if the user requested the 'Register a family' page
        } else if( locals.targetPage.get( 'key' ) === 'register-a-family' ) {
            // if the user is logged in as a social worker
            if( locals.user && locals.user.userType === 'social worker' ) {
                // specify that it should render a button after the content
                locals.pageActions.hasButtons = true;
                // set the button contents
                locals.pageActions.buttons.push( { text: 'Register a Family', target: '/forms/family-registration-form' } );
            // if the user is not a logged in social worker
            } else {
                // set the section contents
                locals.pageActions.sections.push( `You must be logged in as a social worker to register a family.  If you're a social worker, you can <a href="/register#social-worker">register here</a>.` );
            }
        // otherwise, if the user requested any page in the 'Considering Adoption section
        } else if( locals.currentSection.title === 'Considering Adoption?' ) {
            // specify that it should render a button after the content
            locals.pageActions.hasButtons = true;
            // set the button contents
            locals.pageActions.buttons.push( { text: 'Request Adoption Information', target: '/forms/information-request-form' } );
        }
        // render the view once all the data has been retrieved
		view.render( 'page' );

	});
};
