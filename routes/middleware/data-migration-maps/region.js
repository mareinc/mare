var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getRegionsMap = ( req, res, done ) => {

	console.log( `fetching regions map` );

	var locals = res.locals;
	// create an area in locals for the regions map
	locals.migration.maps.regions = {};

	async.parallel([

		done => { dataMigrationService.getModelId( { model: 'Region', field: 'region', value: 'western', mapTo: [ 1000 ], namespace: locals.migration.maps.regions }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Region', field: 'region', value: 'central', mapTo: [ 1001 ], namespace: locals.migration.maps.regions }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Region', field: 'region', value: 'other', mapTo: [ 1002, 1006, 1008 ], namespace: locals.migration.maps.regions }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Region', field: 'region', value: 'northern', mapTo: [ 1003 ], namespace: locals.migration.maps.regions }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Region', field: 'region', value: 'southern', mapTo: [ 1004 ], namespace: locals.migration.maps.regions }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Region', field: 'region', value: 'Boston', mapTo: [ 1005 ], namespace: locals.migration.maps.regions }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Region', field: 'region', value: 'out of state', mapTo: [ 1007 ], namespace: locals.migration.maps.regions }, done ); }

	], () => {

		console.log( `regions map set` );
		done();
	});
}