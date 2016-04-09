var keystone	= require('keystone'),
	Child		= keystone.list('Child');

exports.getAllChildren = function getAllChildren(req, res, done) {

	var locals = res.locals;

	Child.model.find()
				.exec()
				.then(function (children) {

					locals.children = children;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					// execute done function if async is used to continue the flow of execution
					done();

				});
}

exports.getUnrestrictedChildren = function getUnrestrictedChildren(req, res, done) {

	var locals = res.locals;

	Child.model.find()
				.where('siteVisibility', 'everyone')
				.exec()
				.then(function (children) {

					locals.children = children;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					// execute done function if async is used to continue the flow of execution
					done();

				});

}