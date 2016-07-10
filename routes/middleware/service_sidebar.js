var keystone			= require('keystone'),
	async				= require('async'),
	eventService		= require('./service_event'),
	successStoryService	= require('./service_success-story');

exports.populateSidebar = function populateSidebar(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { successStoryService.getRandomStory(req, res, done); },
		function(done) { eventService.getRandomEvent(req, res, done); }
	], function() {

		done();

	});
};
