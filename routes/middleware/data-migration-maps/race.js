var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getRacesMap = function getRacesMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Race', targetField: 'race', targetValue: 'African American', returnTarget: 'raceAfricanAmerican'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Race', targetField: 'race', targetValue: 'Asian', returnTarget: 'raceAsian'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Race', targetField: 'race', targetValue: 'Caucasian', returnTarget: 'raceCaucasian'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Race', targetField: 'race', targetValue: 'Hispanic', returnTarget: 'raceHispanic'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Race', targetField: 'race', targetValue: 'Native American', returnTarget: 'raceNativeAmerican'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Race', targetField: 'race', targetValue: 'other', returnTarget: 'raceOther'  }); }
		
	], function() {

		locals.racesMap = {
			"1" : locals.raceAfricanAmerican,
			"2" : locals.raceAsian,
			"3" : locals.raceCaucasian,
			"4" : locals.raceHispanic,
			"5" : locals.raceNativeAmerican,
			// "6" : "African American/Asian",
			// "7" : "African American/Cauc.",
			// "8" : "African American/Hispanic",
			// "9" : "African American/Nat.Amer",
			// "10": "Asian/Cauc.",
			// "11": "Asian/Hispanic",
			// "12": "Asian/Nati.Amer.",
			// "13": "Caucasian/Hispanic",
			// "14": "Caucasian/Nat.Amer.",
			// "15": "Hispanic/Nat.Amer.",
			"16": locals.raceOther
		};

		done();
	});
}