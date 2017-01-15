var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getLegalStatusesMap = ( req, res, done ) => {

	console.log( `fetching legal statuses map` );

	var locals = res.locals;
	// create an area in locals for the legal statuses map
	locals.migration.maps.legalStatuses = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Legal Status', field: 'legalStatus', value: 'free', mapTo: [ 'F' ], namespace: locals.migration.maps.legalStatuses }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Legal Status', field: 'legalStatus', value: 'legal risk', mapTo: [ 'R' ], namespace: locals.migration.maps.legalStatuses }, done ); }
		
	], () => {

		console.log( `legal statuses map set` );
		done();
	});
};