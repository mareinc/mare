var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getChildTypesMap = ( req, res, done ) => {

	console.log( `fetching child types map` );

	var locals = res.locals;
	// create an area in locals for the child types map
	locals.migration.maps.childTypes = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Child Type', field: 'childType', value: 'biological', mapTo: [ 'B' ], namespace: locals.migration.maps.childTypes }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Child Type', field: 'childType', value: 'adopted - domestic', mapTo: [ 'D' ], namespace: locals.migration.maps.childTypes }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Child Type', field: 'childType', value: 'adopted - international', mapTo: [ 'I' ], namespace: locals.migration.maps.childTypes }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Child Type', field: 'childType', value: 'adopted - foster care', mapTo: [ 'F' ], namespace: locals.migration.maps.childTypes }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Child Type', field: 'childType', value: 'other', mapTo: [ 'O' ], namespace: locals.migration.maps.childTypes }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Child Type', field: 'childType', value: 'unknown', mapTo: [ 'U' ], namespace: locals.migration.maps.childTypes }, done ); }
	
	], () => {

		console.log( `child types map set` );
		done();
	});
};