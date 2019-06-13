const _ = require( 'underscore' );

/* fetches and clears the flashMessages before a view is rendered */
exports.flashMessages = function(req, res, next) {
	'use strict';

	var flashMessages = {
		info: req.flash( 'info' ),
		success: req.flash( 'success' ),
		warning: req.flash( 'warning' ),
		error: req.flash( 'error' )
	};

	res.locals.messages = _.any( flashMessages, function( msgs ) { return msgs.length; }) ? flashMessages : false;

	next();

};