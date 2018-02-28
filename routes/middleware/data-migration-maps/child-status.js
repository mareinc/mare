var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getChildStatusesMap = ( req, res, done ) => {

	console.log( `fetching child statuses map` );

	var locals = res.locals;
	// create an area in locals for the child statuses map
	locals.migration.maps.childStatuses = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Child Status', field: 'childStatus', value: 'active', mapTo: [ 'A' ], namespace: locals.migration.maps.childStatuses }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Child Status', field: 'childStatus', value: 'disrupted', mapTo: [ 'D' ], namespace: locals.migration.maps.childStatuses }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Child Status', field: 'childStatus', value: 'on hold', mapTo: [ 'H' ], namespace: locals.migration.maps.childStatuses }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Child Status', field: 'childStatus', value: 'placed', mapTo: [ 'L', 'M', 'P' ], namespace: locals.migration.maps.childStatuses }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Child Status', field: 'childStatus', value: 'reunification', mapTo: [ 'R' ], namespace: locals.migration.maps.childStatuses }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Child Status', field: 'childStatus', value: 'withdrawn', mapTo: [ 'N, W' ], namespace: locals.migration.maps.childStatuses }, done ); }
	
	], () => {

		console.log( `child statuses map set` );
		done();
	});
};