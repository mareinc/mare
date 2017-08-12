const keystone		= require( 'keystone' ),
	  userService	= require( '../middleware/service_user' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view		= new keystone.View( req, res ),		  
		  locals	= res.locals;
	
	// assign properties to locals for access during templating
	locals.user = req.user;
	
	// set the layout to render without the right sidebar
	locals[ 'render-with-sidebar' ] = false;
	// render the view using the account.hbs template
	view.render( 'account' );
};