var keystone	= require('keystone'),
	Page		= keystone.list('Page');

exports.getPageByUrl = function getPageByUrl(req, res, done, url) {

	req.locals = res.locals || {};
	var locals = res.locals;

	Page.model.find()
				.where('url', url)
				.exec()
				.then(function (targetPage) {

					locals.targetPage = targetPage[0];
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};