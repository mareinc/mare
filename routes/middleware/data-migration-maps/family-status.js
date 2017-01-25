var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getFamilyStatusesMap = ( req, res, done ) => {

	console.log( `fetching family statuses map` );

	var locals = res.locals;
	// create an area in locals for the family statuses map
	locals.migration.maps.familyStatuses = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Family Status', field: 'familyStatus', value: 'active', mapTo: [ 'A' ], namespace: locals.migration.maps.familyStatuses }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Status', field: 'familyStatus', value: 'disrupted', mapTo: [ 'D' ], namespace: locals.migration.maps.familyStatuses }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Status', field: 'familyStatus', value: 'on hold', mapTo: [ 'H' ], namespace: locals.migration.maps.familyStatuses }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Status', field: 'familyStatus', value: 'placed', mapTo: [ 'P' ], namespace: locals.migration.maps.familyStatuses }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Family Status', field: 'familyStatus', value: 'withdrawn', mapTo: [ 'W' ], namespace: locals.migration.maps.familyStatuses }, done ); }
	
	], () => {

		console.log( `family statuses map set` );
		done();
	});
};