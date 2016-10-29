var _ 					= require('underscore'),
	keystone 			= require('keystone'),
	Agency				= keystone.list('Agency'),
	ChildStatus			= keystone.list('Child Status'),
	CityOrTown			= keystone.list('City or Town'),
	Gender				= keystone.list('Gender'),
	Language			= keystone.list('Language'),
	LegalStatus			= keystone.list('Legal Status'),
	OutsideContactGroup	= keystone.list('Outside Contact Group'),
	Race				= keystone.list('Race'),
	Region				= keystone.list('Region'),
	Residence			= keystone.list('Residence'),
	State				= keystone.list('State');

exports.getTargetModel = function getTargetModel(modelName) {

		switch(modelName) {
			case 'Agency'				: return Agency;
			case 'Child Status'			: return ChildStatus;
			case 'Gender'				: return Gender;
			case 'Language'				: return Language;
			case 'Legal Status' 		: return LegalStatus;
			case 'City or Town'			: return CityOrTown;
			case 'Outside Contact Group': return OutsideContactGroup;
			case 'Race'					: return Race;
			case 'Region'				: return Region;
			case 'Residence'			: return Residence;
			case 'State'				: return State;
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

			// console.log(model);

			locals[options.returnTarget] = model._id;

			done();

		}, function(err) {

			console.log(err);

			done();

		});
};
