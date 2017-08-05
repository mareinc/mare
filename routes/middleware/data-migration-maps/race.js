var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getRacesMap = ( req, res, done ) => {

	console.log( `fetching races map` );

	var locals = res.locals;
	// create an area in locals for the races map
	locals.migration.maps.races = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Race', field: 'race', value: 'African American', mapTo: [ 1, 6, 7, 8, 9 ], namespace: locals.migration.maps.races }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Race', field: 'race', value: 'Asian', mapTo: [ 2, 6, 10, 11, 12 ], namespace: locals.migration.maps.races }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Race', field: 'race', value: 'Caucasian', mapTo: [ 3, 7, 10, 13, 14 ], namespace: locals.migration.maps.races }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Race', field: 'race', value: 'Hispanic', mapTo: [ 4, 8, 11, 13, 15 ], namespace: locals.migration.maps.races }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Race', field: 'race', value: 'Native American', mapTo: [ 5, 9, 12, 14, 15 ], namespace: locals.migration.maps.races }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Race', field: 'race', value: 'other', mapTo: [ 16 ], namespace: locals.migration.maps.races }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Race', field: 'race', value: 'unknown', mapTo: [ 17 ], namespace: locals.migration.maps.races }, done ); } // 17 doesn't exist, it's just a placeholder to let us access the value in the new system
		
	], () => {

		console.log( `races map set` );
		done();
	});
};