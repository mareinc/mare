var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getClosedReasonsMap = ( req, res, done ) => {

	console.log( `fetching closed reasons map` );

	var locals = res.locals;
	// create an area in locals for the closed reasons map
	locals.migration.maps.closedReasons = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Closed Reason', field: 'reason', value: 'no longer pursuing adoption', mapTo: [ 1 ], namespace: locals.migration.maps.closedReasons }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Closed Reason', field: 'reason', value: 'no contact', mapTo: [ 2 ], namespace: locals.migration.maps.closedReasons }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Closed Reason', field: 'reason', value: 'family request', mapTo: [ 3 ], namespace: locals.migration.maps.closedReasons }, done ); }
		
	], () => {

		console.log( `closed reasons map set` );
		done();
	});
};