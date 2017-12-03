var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getCitiesOrTownsMap = ( req, res, done ) => {

	console.log( `fetching cities map` );

	var locals = res.locals;
	// create an area in locals for the cities map
	locals.migration.maps.citiesOrTowns = {};

	async.parallel([

		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'western', mapTo: [ 1000 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'central', mapTo: [ 1001 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'other', mapTo: [ 1002, 1006, 1008 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'northern', mapTo: [ 1003 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'southern', mapTo: [ 1004 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'Boston', mapTo: [ 1005 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'out of state', mapTo: [ 1007 ], namespace: locals.migration.maps.citiesOrTowns }, done ); }

	], () => {

		console.log( `cities map set` );
		done();
	});
}