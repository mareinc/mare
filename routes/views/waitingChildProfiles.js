var keystone		= require('keystone'),
	async			= require('async'),
	childService	= require('../middleware/service_child');

exports = module.exports = function(req, res) {
	'use strict';

	var view			= new keystone.View(req, res),
		locals			= res.locals;

	// Set local variables
	locals.userType	= req.user ? req.user.get('userType') : 'anonymous';
	locals.targetChildren = locals.userType === 'anonymous' || locals.userType === 'site visitor' ? 'unrestricted' : 'all';

	async.series([
		function(done) {

			if(locals.targetChildren === 'all') {
				childService.getAllChildren(req, res, done);
			} else {
				childService.getUnrestrictedChildren(req, res, done);
			}

		}

	], function() {

		view.render('waitingChildProfiles');

	});

};