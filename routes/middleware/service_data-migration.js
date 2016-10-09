var _ 					= require('underscore'),
	keystone 			= require('keystone'),
	State				= keystone.list('State'),
	OutsideContactGroup	= keystone.list('Outside Contact Group');

exports.getTargetModel = function getTargetModel(modelName) {

		switch(modelName) {
			case 'State'				: return State;
			case 'Outside Contact Group': return OutsideContactGroup;
		}

	};

exports.getModelId = function getModelId(req, res, done, options) {
	'use strict';

	var locals = res.locals,
		targetModel = exports.getTargetModel(options.model);

	targetModel.model.findOne()
		.where(options.targetField, options.targetValue)
		.exec()
		.then(function (model) {

			locals[options.returnTarget] = model._id;

			done();

		}, function(err) {

			console.log(err);

			done();

		});
};
