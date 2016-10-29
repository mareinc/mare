var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getGendersMap = function getGendersMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Gender', targetField: 'gender', targetValue: 'female', returnTarget: 'raceFemale'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Gender', targetField: 'gender', targetValue: 'male', returnTarget: 'raceMale'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Gender', targetField: 'gender', targetValue: 'other', returnTarget: 'raceOther'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Gender', targetField: 'gender', targetValue: 'transgender', returnTarget: 'raceTransgender'  }); }
		
	], function() {

		locals.gendersMap = {
			"F": locals.raceFemale,
			"M": locals.raceMale,
			"O": locals.raceOther,
			"T": locals.raceTransgender
		};

		done();
	});
}