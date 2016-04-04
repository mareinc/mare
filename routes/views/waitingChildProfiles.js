var keystone	= require('keystone'),
	async		= require('async'),
	User		= keystone.list('User');
	Child		= keystone.list('Child');

exports = module.exports = function(req, res) {
	'use strict';

	var view	= new keystone.View(req, res),
		locals	= res.locals,
		userId	= req.user.get('_id');

	async.parallel([
		function(done) {
			Child.model.find()
				.exec()
				.then(function (results) {

					locals.children = results;

					done();
				})},
		function(done) {
			User.model.findById(userId)
				.exec()
				.then(function(user) {

					locals.user = user;

					done();
			})}
	], function() {
		console.log(locals.user.userType);
		view.render('waitingChildProfiles');
	});

};