var keystone					= require('keystone'),
	async						= require('async'),
	_							= require('underscore'),
	registrationMiddleware		= require('../middleware/register'),
	Region 						= keystone.list('Region'),
	Position					= keystone.list('Social Worker Position'),
	Race						= keystone.list('Race'),
	State						= keystone.list('State'),
	Gender						= keystone.list('Gender'),
	LegalStatus					= keystone.list('Legal Status'),
	FamilyConstellation			= keystone.list('Family Constellation'),
	Disability					= keystone.list('Disability'),
	OtherConsideration			= keystone.list('Other Consideration'),
	WayToHearAboutMARE			= keystone.list('Way To Hear About MARE');

exports = module.exports = function(req, res) {
	'use strict';

	var view = new keystone.View(req, res),
		locals = res.locals;

	// Set locals
	locals.validationErrors = {};
	locals.registrationSubmitted = false;
	// Fetch all the dynamic data to fill in the form dropdown and selection areas.  Render the view once all the data has been retrieved.
	// TODO: these can be brought to a more generic place for reuse, maybe in a services layer.
	async.parallel([
		function(done) {
			State.model.find().select('state').exec().then(function(states) {

				_.each(states, function(state) {
					if(state.state === 'Massachusetts') {
						state.defaultSelection = true;
					}
				});

				locals.states = states;

				done();
			})},
		function(done) {
			Race.model.find().select('race').exec().then(function(races) {
				locals.races = races;
				done();
			})},
		function(done) {
			Gender.model.find().select('gender').exec().then(function(genders) {
				locals.genders = genders;
				done();
			})},
		function(done) {
			Region.model.find().select('region').exec().then(function(regions) {
				locals.regions = regions;
				done();
			})},
		function(done) {
			Position.model.find().select('position').exec().then(function(positions) {
				locals.positions = positions;
				done();
			})},
		function(done) {
			FamilyConstellation.model.find().select('familyConstellation').exec().then(function(familyConstellations) {
				locals.familyConstellations = familyConstellations;
				done();
			})},
		function(done) {
			LegalStatus.model.find().select('legalStatus').exec().then(function(legalStatuses) {
				locals.legalStatuses = legalStatuses;
				done();
			})},
		function(done) {
			Disability.model.find().select('disability').exec().then(function(disabilities) {
				locals.disabilities = disabilities;
				done();
			})},
		function(done) {
			OtherConsideration.model.find().select('otherConsideration').exec().then(function(otherConsiderations) {
				locals.otherConsiderations = otherConsiderations;
				done();
			})},
		function(done) {
			WayToHearAboutMARE.model.find().select('wayToHearAboutMARE').exec().then(function(waysToHearAboutMARE) {

				_.each(waysToHearAboutMARE, function(wayToHearAboutMARE) {
					if(wayToHearAboutMARE.wayToHearAboutMARE === 'other') {
						wayToHearAboutMARE.other = true;
					}
				});

				locals.waysToHearAboutMARE = waysToHearAboutMARE;
				done();
			})}
	], function() {
		view.render('register');
	});
};
