var keystone				= require('keystone'),
	_						= require('underscore'),
	Region 					= keystone.list('Region'),
	Position				= keystone.list('Social Worker Position'),
	Race					= keystone.list('Race'),
	State					= keystone.list('State'),
	Gender					= keystone.list('Gender'),
	LegalStatus				= keystone.list('Legal Status'),
	Language				= keystone.list('Language'),
	FamilyConstellation		= keystone.list('Family Constellation'),
	Disability				= keystone.list('Disability'),
	OtherConsideration		= keystone.list('Other Consideration'),
	ChildType				= keystone.list('Child Type'),
	WayToHearAboutMARE		= keystone.list('Way To Hear About MARE');

exports.getAllRegions = function getAllRegions(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	Region.model.find()
				.exec()
				.then(function (regions) {

					locals.regions = regions;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getAllSocialWorkerPositions = function getAllSocialWorkerPositions(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	Position.model.find()
				.exec()
				.then(function (positions) {

					locals.positions = positions;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getAllRaces = function getAllRaces(req, res, done, options) {

	req.locals = res.locals || {};
	var locals = res.locals;

	Race.model.find()
				.exec()
				.then(function (races) {
					// If there is a value of 'other' in the list, which should appear at the bottom of any
					// dropdown lists on the site, add an appropriate attribute
					if(options && options.other) {

						_.each(races, function(race) {
							if(race.race === 'other') {
								race.other = true;
							}
						});

					}

					locals.races = races;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getAllStates = function getAllStates(req, res, done, options) {

	req.locals = res.locals || {};
	var locals = res.locals;

	State.model.find()
				.exec()
				.then(function (states) {
					// If there is a default value which should appear selected when a dropdown menu is first rendered add an appropriate attribute
					if(options && options.default) {

						_.each(states, function(state) {
							if(state.state === options.default) {
								state.defaultSelection = true;
							}
						});

					}

					locals.states = states;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getAllGenders = function getAllGenders(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	Gender.model.find()
				.exec()
				.then(function (genders) {

					locals.genders = genders;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getAllLegalStatuses = function getAllLegalStatuses(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	LegalStatus.model.find()
				.exec()
				.then(function (legalStatuses) {

					locals.legalStatuses = legalStatuses;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getAllLanguages = function getAllLanguages(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	Language.model.find()
				.exec()
				.then(function (languages) {

					locals.languages = languages;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getAllFamilyConstellations = function getAllFamilyConstellations(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	FamilyConstellation.model.find()
				.exec()
				.then(function (familyConstellations) {

					locals.familyConstellations = familyConstellations;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getAllDisabilities = function getAllDisabilities(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	Disability.model.find()
				.exec()
				.then(function (disabilities) {

					locals.disabilities = disabilities;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getOtherConsiderations = function getOtherConsiderations(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	OtherConsideration.model.find()
				.exec()
				.then(function (otherConsiderations) {

					locals.otherConsiderations = otherConsiderations;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getAllChildTypes = function getAllChildTypes(req, res, done) {

	req.locals = res.locals || {};
	var locals = res.locals;

	ChildType.model.find()
				.exec()
				.then(function (childType) {

					locals.childType = childType;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.getAllWaysToHearAboutMARE = function getAllWaysToHearAboutMARE(req, res, done, options) {

	req.locals = res.locals || {};
	var locals = res.locals;

	WayToHearAboutMARE.model.find()
				.exec()
				.then(function (waysToHearAboutMARE) {
					// If there is a value of 'other' in the list, which should appear at the bottom of any
					// dropdown lists on the site, add an appropriate attribute
					if(options && options.other) {

						_.each(waysToHearAboutMARE, function(wayToHearAboutMARE) {
							if(wayToHearAboutMARE.wayToHearAboutMARE === 'other') {
								wayToHearAboutMARE.other = true;
							}
						});

					}

					locals.waysToHearAboutMARE = waysToHearAboutMARE;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					done();

				});
};