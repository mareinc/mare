const keystone		= require( 'keystone' ),
	  async			= require( 'async' ),
	  userService	= require( '../middleware/service_user' );

exports = module.exports = (req, res) => {
    'use strict';

    var view = new keystone.View( req, res ),
        locals = res.locals;

    var userId = req.user.get( '_id' );

    async.parallel([
		done => { userService.getUserById(req, res, done, userId); }
	], () => {
		// Set the layout to render without the right sidebar
		locals[ 'render-with-sidebar' ] = false;
		locals[ 'render-without-header' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'account' );

	});

};