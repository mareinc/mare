var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getStatesMap = function getStatesMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'State', targetField: 'state', targetValue: 'Massachusetts', returnTarget: 'stateMA'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'State', targetField: 'state', targetValue: 'Indiana', returnTarget: 'stateIN'  }); }
		
	], function() {

		locals.statesMap = {
			"IN": locals.stateIN,
			"MA": locals.stateMA
		};

		done();
	});
}
