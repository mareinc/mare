var keystone		= require('keystone'),
	async			= require('async'),
	userService		= require('../middleware/service_user');

exports = module.exports = function(req, res) {
    'use strict';

    var view = new keystone.View(req, res),
        locals = res.locals;

    var userId = req.user.get('_id');

    async.parallel([
		function(done) { userService.getUserById(req, res, done, userId); }
	], function() {

		view.render('preferences');

	});

};