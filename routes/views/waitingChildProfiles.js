var keystone		= require('keystone'),
	async			= require('async'),
	childService	= require('../middleware/service_child'),
	userService		= require('../middleware/service_user');

exports = module.exports = function(req, res) {
	'use strict';

	var view			= new keystone.View(req, res),
		locals			= res.locals;

	// Set local variables
	locals.userType	= req.user ? req.user.get('userType') : 'anonymous';

	async.series([
		function(done) {

			if(locals.userType === 'anonymous' || locals.userType === 'site visitor') {
				childService.getUnrestrictedChildren(req, res, done);
			} else {
				childService.getAllChildren(req, res, done);
			}
		}

	], function() {

		view.render('waitingChildProfiles');

	});

};