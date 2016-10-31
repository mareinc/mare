var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getLanguagesMap = function getLanguagesMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Language', targetField: 'language', targetValue: 'Chinese', returnTarget: 'languageChinese'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Language', targetField: 'language', targetValue: 'English', returnTarget: 'languageEnglish'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Language', targetField: 'language', targetValue: 'Portuguese', returnTarget: 'languagePortugese'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Language', targetField: 'language', targetValue: 'Spanish', returnTarget: 'languageSpanish'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Language', targetField: 'language', targetValue: 'other', returnTarget: 'languageOther'  }); }
		
	], function() {

		locals.languagesMap = {
			"Chinese" : locals.languageChinese,
			"English" : locals.languageEnglish,
			"Portuguese" : locals.languagePortugese,
			"Spanish" : locals.languageSpanish,
			"other" : locals.languageOther
		};

		done();
	});
}