var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getCitiesOrTownsMap = ( req, res, done ) => {

	console.log( `fetching cities map` );

	var locals = res.locals;
	// create an area in locals for the cities map
	locals.migration.maps.citiesOrTowns = {};

	async.parallel([

		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'Western', mapTo: [ 1000 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'Central', mapTo: [ 1001 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'Other', mapTo: [ 1002, 1006, 1008 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'Northern', mapTo: [ 1003 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'Southern', mapTo: [ 1004 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'Boston', mapTo: [ 1005 ], namespace: locals.migration.maps.citiesOrTowns }, done ); },
		done => { dataMigrationService.getModelId( { model: 'City or Town', field: 'cityOrTown', value: 'Out of state', mapTo: [ 1007 ], namespace: locals.migration.maps.citiesOrTowns }, done ); }

	], () => {

		console.log( `cities map set` );
		done();
	});
}