var _ 					= require('underscore'),
	keystone 			= require('keystone'),
	Agency				= keystone.list('Agency'),
	ChildStatus			= keystone.list('Child Status'),
	CityOrTown			= keystone.list('City or Town'),
	ClosedReasons		= keystone.list('Closed Reason'),
	Gender				= keystone.list('Gender'),
	FamilyConstellation = keystone.list('Family Constellation'),
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
			case 'City or Town'			: return CityOrTown;
			case 'Closed Reason'		: return ClosedReasons;
			case 'Gender'				: return Gender;
			//add family here
			case 'Family Constellation' : return FamilyConstellation;
			case 'Language'				: return Language;
			case 'Legal Status' 		: return LegalStatus;
			case 'Outside Contact Group': return OutsideContactGroup;
			case 'Race'					: return Race;
			case 'Region'				: return Region;
			case 'Residence'			: return Residence;
			case 'State'				: return State;
		}

	};

exports.getModelId = function getModelId(req, res, done, options) {
	'use strict';

	let locals = res.locals,
		targetModel = exports.getTargetModel( options.model );

	targetModel.model.find()
		.where( options.targetField, options.targetValue )
		.exec()
		.then( function( model ) {

			locals[ options.returnTarget ] = model[ 0 ]._id;
			done();

		}, function( err ) {

			console.log(err);
			done();
		});
};

exports.getModelMap = function( done, options ) {
	'use strict';

	const targetModel = exports.getTargetModel( options.model );
	// store map in a variable as a performance improvement to prevent an object chain lookup for each iteration
	let map = options.map;

	targetModel.model.find()
		.exec()
		.then( function( models ) {

			for( let model of models ) {
				// uses the passed in map object to bind the id in the old system ( key ) to the id in the new system ( value )
				map[ model.oldId ] = model._id;
			}

			done();
		});
}
