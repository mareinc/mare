var keystone					= require('keystone'),
	async						= require('async'),
	registrationMiddleware		= require('../middleware/register'),
	listsService				= require('../middleware/service_lists');


exports = module.exports = function(req, res) {
	'use strict';

	var view 	= new keystone.View(req, res),
		locals 	= res.locals;

	// objects with additional search parameters
	var stateOptions		= { default: 'Massachusetts' },
		raceOptions			= { other: true },
		waysToHearOptions	= { other: true };



	// Fetch all the dynamic data to fill in the form dropdown and selection areas.
	async.parallel([
		function(done) { listsService.getAllStates(req, res, done, stateOptions) },
		function(done) { listsService.getAllRaces(req, res, done, raceOptions) },
		function(done) { listsService.getAllGenders(req, res, done) },
		function(done) { listsService.getAllRegions(req, res, done) },
		function(done) { listsService.getAllSocialWorkerPositions(req, res, done) },
		function(done) { listsService.getAllFamilyConstellations(req, res, done) },
		function(done) { listsService.getAllLegalStatuses(req, res, done) },
		function(done) { listsService.getAllLanguages(req, res, done) },
		function(done) { listsService.getAllDisabilities(req, res, done) },
		function(done) { listsService.getOtherConsiderations(req, res, done) },
		function(done) { listsService.getAllWaysToHearAboutMARE(req, res, done, waysToHearOptions) }
	], function() {
		// Render the view once all the data has been retrieved
		view.render('register');

	});
};
