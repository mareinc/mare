var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getClosedReasonsMap = function getClosedReasonsMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Closed Reason', targetField: 'reason', targetValue: 'family request', returnTarget: 'closedStatusFamilyRequest'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Closed Reason', targetField: 'reason', targetValue: 'no contact', returnTarget: 'closedStatusNoContact'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Closed Reason', targetField: 'reason', targetValue: 'no longer pursuing adoption', returnTarget: 'closedStatusNoLongerPursuingAdoption'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Closed Reason', targetField: 'reason', targetValue: 'unregistered family placed', returnTarget: 'closedStatusUnregisteredFamilyPlaced'  }); }
		
	], function() {

		locals.closedReasonsMap = {
			"Family request" : locals.closedStatusFamilyRequest,
			"No Contact" : locals.closedStatusNoContact,
			"no longer pursuing adoption" : locals.closedStatusNoLongerPursuingAdoption,
			"unregistered family placed" : locals.closedStatusUnregisteredFamilyPlaced
		};

		done();
	});
}