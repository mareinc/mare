var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getLegalStatusesMap = function getLegalStatusesMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Legal Status', targetField: 'legalStatus', targetValue: 'free', returnTarget: 'legalStatusFree'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Legal Status', targetField: 'legalStatus', targetValue: 'legal risk', returnTarget: 'legalStatusLegalRisk'  }); }
		
	], function() {

		locals.racesMap = {
			"F" : locals.legalStatusFree,
			"R" : locals.legalStatusLegalRisk
		};

		done();
	});
}