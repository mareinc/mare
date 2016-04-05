var keystone		= require('keystone'),
	async			= require('async'),
	User			= keystone.list('User'),
	Child			= keystone.list('Child');
	childService	= require('../middleware/service_child'),
	userService		= require('../middleware/service_user');

exports = module.exports = function(req, res) {
	'use strict';

	var view	= new keystone.View(req, res),
		locals	= res.locals,
		userId	= req.user.get('_id');

	async.parallel([
		function(done) { childService.getAllChildren(req, res, done); },
		function(done) { userService.getUserById(req, res, done, userId); }
	], function() {

		view.render('waitingChildProfiles');

	});

};