var keystone		= require('keystone'),
	User			= keystone.list('User'),
	Admin			= keystone.list('Admin'),
	SiteVisitor		= keystone.list('Site Visitor'),
	SocialWorker	= keystone.list('Social Worker'),
	Family			= keystone.list('Family');

exports.getUserById = function getUserById(req, res, done, id) {

	req.locals = res.locals || {};
	var locals = res.locals;

	User.model.findById(id)
				.exec()
				.then(function (user) {

					locals.user = user;
					// execute done function if async is used to continue the flow of execution
					done();

				}, function(err) {

					console.log(err);
					done();

				});
}