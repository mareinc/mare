var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getDisabilitiesMap = ( req, res, done ) => {

	console.log( `fetching disabilities map` );

	var locals = res.locals;
	// create an area in locals for the states map
	locals.migration.maps.disabilities = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Disability', field: 'disability', value: 'autism spectrum disorder', mapTo: [ 70 ], namespace: locals.migration.maps.disabilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Disability', field: 'disability', value: 'cerebral palsy', mapTo: [ 20 ], namespace: locals.migration.maps.disabilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Disability', field: 'disability', value: 'down syndrome', mapTo: [ 10 ], namespace: locals.migration.maps.disabilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Disability', field: 'disability', value: 'fetal alcohol syndrome', mapTo: [ 60 ], namespace: locals.migration.maps.disabilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Disability', field: 'disability', value: 'hearing loss', mapTo: [ 40 ], namespace: locals.migration.maps.disabilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Disability', field: 'disability', value: 'visual impairment', mapTo: [ 50 ], namespace: locals.migration.maps.disabilities }, done ); }
	
	], () => {

		console.log( `disabilities map set` );
		done();
	});
}
