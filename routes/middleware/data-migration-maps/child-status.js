
var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getChildStatusesMap = function getChildStatusesMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Child Status', targetField: 'childStatus', targetValue: 'active', returnTarget: 'languageActive'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Child Status', targetField: 'childStatus', targetValue: 'disrupted', returnTarget: 'languageDisrupted'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Child Status', targetField: 'childStatus', targetValue: 'on hold', returnTarget: 'languageOnHold'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Child Status', targetField: 'childStatus', targetValue: 'placed', returnTarget: 'languagePlaced'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Child Status', targetField: 'childStatus', targetValue: 'reunification', returnTarget: 'languageReunification'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Child Status', targetField: 'childStatus', targetValue: 'withdrawn', returnTarget: 'languageWithdrawn'  }); }
		
	], function() {

		locals.childStatusesMap = {
			"A": locals.languageActive,
			"D": locals.languageDisrupted,
			"H": locals.languageOnHold,
			"P": locals.languagePlaced,
			"R": locals.languageReunification,
			"W": locals.languageWithdrawn
		};

		done();
	});
}