var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getFamilyConstellationsMap = ( req, res, done ) => {

	console.log( `fetching family constellations map` );

	var locals = res.locals;
	// create an area in locals for the family constellations map
	locals.migration.maps.familyConstellations = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Family Constellation', field: 'familyConstellation', value: 'female/female couple', mapTo: [ 'FFC' ], namespace: locals.migration.maps.familyConstellations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Constellation', field: 'familyConstellation', value: 'male/female couple', mapTo: [ 'MFC' ], namespace: locals.migration.maps.familyConstellations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Constellation', field: 'familyConstellation', value: 'male/male couple', mapTo: [ 'MMC' ], namespace: locals.migration.maps.familyConstellations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Constellation', field: 'familyConstellation', value: 'single female', mapTo: [ 'SIF' ], namespace: locals.migration.maps.familyConstellations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Constellation', field: 'familyConstellation', value: 'single gay female', mapTo: [ 'SGF' ], namespace: locals.migration.maps.familyConstellations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Constellation', field: 'familyConstellation', value: 'single gay male', mapTo: [ 'SGM' ], namespace: locals.migration.maps.familyConstellations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Constellation', field: 'familyConstellation', value: 'single male', mapTo: [ 'SIM' ], namespace: locals.migration.maps.familyConstellations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Constellation', field: 'familyConstellation', value: 'single straight female', mapTo: [ 'SSF' ], namespace: locals.migration.maps.familyConstellations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Constellation', field: 'familyConstellation', value: 'single straight male', mapTo: [ 'SSM' ], namespace: locals.migration.maps.familyConstellations }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Constellation', field: 'familyConstellation', value: 'unknown', mapTo: [ 'UUU' ], namespace: locals.migration.maps.familyConstellations }, done ); }
		
	], () => {

		console.log( `family constellations map set` );
		done();
	});
}
