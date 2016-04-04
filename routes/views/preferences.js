var keystone	= require('keystone'),
	async		= require('async'),
	User		= keystone.list('User');

exports = module.exports = function(req, res) {
    'use strict';

    var view = new keystone.View(req, res),
        locals = res.locals;

    var userId = req.user.get('_id');

    async.parallel([
		function(done) {
			User.model.findById(userId)
				.exec()
				.then(function(user) {

					locals.user = user;

					done();
			})}
	], function() {
		view.render('preferences');
	});

};