var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getResidencesMap = function getResidencesMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Residence', targetField: 'residence', targetValue: 'IFC', returnTarget: 'residenceIFC'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Residence', targetField: 'residence', targetValue: 'foster home', returnTarget: 'residenceFosterHome'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Residence', targetField: 'residence', targetValue: 'residential/group care', returnTarget: 'residenceResidentialGroupCare'  }); }
		
	], function() {

		locals.residencesMap = {
			// "1" : locals.legalStatusFree,
			// "2" : locals.legalStatusLegalRisk,
			// "3"
		};

		done();
	});
}