/* NOTE: probably not needed as the cities are a 1 to 1 mapping between systems */

var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getCitiesMap = function getCitiesMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'City or Town', targetField: 'cityOrTown', targetValue: 'ABINGTON', returnTarget: 'cityAbington'  }); }
		
	], function() {

		locals.citiesMap = {
			// "1" : locals.cityAbington
		};

		done();
	});
}