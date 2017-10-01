var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getOtherFamilyConstellationConsiderationsMap = ( req, res, done ) => {

	console.log( `fetching other family constellation considerations map` );

	var locals = res.locals;
	// create an area in locals for the other family constellation considerations map
	locals.migration.maps.otherFamilyConstellationConsiderations = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Other Family Constellation Consideration', field: 'otherFamilyConstellationConsideration', value: 'childless home', mapTo: [ 'childless home' ], namespace: locals.migration.maps.otherFamilyConstellationConsiderations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Other Family Constellation Consideration', field: 'otherFamilyConstellationConsideration', value: 'multi-child home', mapTo: [ 'multi-child home' ], namespace: locals.migration.maps.otherFamilyConstellationConsiderations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Other Family Constellation Consideration', field: 'otherFamilyConstellationConsideration', value: 'no pets', mapTo: [ 'no pets' ], namespace: locals.migration.maps.otherFamilyConstellationConsiderations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Other Family Constellation Consideration', field: 'otherFamilyConstellationConsideration', value: 'younger children acceptable', mapTo: [ 'requires younger children' ], namespace: locals.migration.maps.otherFamilyConstellationConsiderations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Other Family Constellation Consideration', field: 'otherFamilyConstellationConsideration', value: 'older children acceptable', mapTo: [ 'requires older children' ], namespace: locals.migration.maps.otherFamilyConstellationConsiderations }, done ); }
		
	], () => {

		console.log( `other family constellation considerations map set` );
		done();
	});
}
