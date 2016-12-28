var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getRegionsMap = function getRegionsMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Region', targetField: 'region', targetValue: 'western', returnTarget: 'regionWestern'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Region', targetField: 'region', targetValue: 'central', returnTarget: 'regionCentral'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Region', targetField: 'region', targetValue: 'other', returnTarget: 'regionContractedAgencies'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Region', targetField: 'region', targetValue: 'northern', returnTarget: 'regionNorthern'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Region', targetField: 'region', targetValue: 'southern', returnTarget: 'regionSoutheast'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Region', targetField: 'region', targetValue: 'Boston', returnTarget: 'regionBoston'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Region', targetField: 'region', targetValue: 'other', returnTarget: 'regionMetro'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Region', targetField: 'region', targetValue: 'out of state', returnTarget: 'regionOutofState'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Region', targetField: 'region', targetValue: 'other', returnTarget: 'regionWPrivateAgency'  }); }
		
	], function(err, results) {

		locals.regionsMap = {
			
			1000: locals.regionWestern,
			1001: locals.regionCentral,
			1002: locals.regionContractedAgencies,
			1003: locals.regionNorthern,
			1004: locals.regionSoutheast,
			1005: locals.regionNorthern,
			1006: locals.regionMetro,
			1007: locals.regionOutofState,
			1008: locals.regionPrivateAgency
		};

		done();
	});
}