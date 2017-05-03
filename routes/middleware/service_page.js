var keystone			= require('keystone'),
	async				= require('async'),
	Page				= keystone.list('Page'),
	eventService		= require('./service_event'),
	successStoryService	= require('./service_success-story');

exports.getPageByUrl = function getPageByUrl(req, res, done, url) {

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

exports.populateSidebar = function populateSidebar(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { successStoryService.getRandomStory(req, res, done); },
		function(done) { eventService.getRandomEvent(req, res, done); }
	], function() {

		done();

	});
};
