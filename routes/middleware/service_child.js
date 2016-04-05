var keystone	= require('keystone'),
	Child		= keystone.list('Child');

exports.getAllChildren = function getAllChildren(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	Child.model.find()
				.exec()
				.then(function (results) {

					locals.children = results;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
}