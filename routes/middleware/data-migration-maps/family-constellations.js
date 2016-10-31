var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getFamilyConstellationsMap = function getFamilyConstellationsMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Family Constellation', targetField: 'familyConstellation', targetValue: 'female/female couple', returnTarget: 'femaleFemaleCouple'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Family Constellation', targetField: 'familyConstellation', targetValue: 'male/female couple', returnTarget: 'maleFemaleCouple'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Family Constellation', targetField: 'familyConstellation', targetValue: 'male/male couple', returnTarget: 'maleMaleCouple'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Family Constellation', targetField: 'familyConstellation', targetValue: 'single female', returnTarget: 'singleFemale'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Family Constellation', targetField: 'familyConstellation', targetValue: 'single gay female', returnTarget: 'singleGayFemale'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Family Constellation', targetField: 'familyConstellation', targetValue: 'single gay male', returnTarget: 'singleGayMale'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Family Constellation', targetField: 'familyConstellation', targetValue: 'single male', returnTarget: 'singleMale'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Family Constellation', targetField: 'familyConstellation', targetValue: 'single straight female', returnTarget: 'singleStraightFemale'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Family Constellation', targetField: 'familyConstellation', targetValue: 'single straight male', returnTarget: 'singleStraightMale'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Family Constellation', targetField: 'familyConstellation', targetValue: 'unknown', returnTarget: 'unknown'  }); }
		
	], function() {

		locals.familyConstellationsMap = {
			"FFC" : locals.femaleFemaleCouple,
			"MFC" : locals.maleFemaleCouple,
			"MMC" : locals.maleMaleCouple,
			"SIF" : locals.singleFemale,
			"SGF" : locals.singleGayFemale,
			"SGM" : locals.singleGayMale,
			"SIM" : locals.singleMale,
			"SSF" : locals.singleStraightFemale,
			"SSM" : locals.singleStraightMale,
			"UUU" : locals.unknown
		};

		done();
	});
}
