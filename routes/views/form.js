// TODO: break these each into their own routes, combining all these forms is going to be a mess once we start processing their expected actions
var keystone		= require('keystone'),
	async			= require('async'),
	_				= require('underscore'),
	Form			= keystone.list('Form'),
	listsService	= require('../middleware/service_lists'),
	pageService		= require('../middleware/service_page');

exports = module.exports = function(req, res) {
	'use strict';

	var view 	= new keystone.View(req, res),
		locals 	= res.locals,
		url 	= req.originalUrl.replace('/form/', '');

	// objects with additional search parameters
	var raceOptions			= { other: true },
		waysToHearOptions	= { other: true };

	async.parallel([
		function(done) { listsService.getAllStates(req, res, done) },
		function(done) { listsService.getAllRaces(req, res, done, raceOptions) },
		function(done) { listsService.getAllGenders(req, res, done) },
		function(done) { listsService.getAllWaysToHearAboutMARE(req, res, done, waysToHearOptions) },
		function(done) { pageService.populateSidebar(req, res, done); },
		function(done) { pageService.getSectionHeader(req, res, done, 'About Us'); }
	], function() {
		// Set the layout to render with the right sidebar
		locals['render-with-sidebar'] = true;

		switch(url) {

			case "adoption-party-family-registration-form":
				view.render('forms/adoption-party.hbs');
				break;

			case "adoption-party-social-worker-registration-form":
				view.render('forms/adoption-party-social-worker.hbs');
				break;

			case "agency-event-submission-form":
				view.render('forms/agency-event-submission.hbs');
				break;

			case "car-donation-form":
				view.render('forms/car-donation.hbs');
				break;

			case "child-registration-form":
				view.render('forms/child-registration.hbs');
				break;

			 case "information-request-form":
				view.render('forms/information-request-form.hbs');
				break;

			case "have-a-question-form":
				view.render('forms/have-a-question-form.hbs');
				break;

			// TODO: Create a custom 404 page
			default: view.render('404');
		}
	});
};
