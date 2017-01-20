var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getMediaTypesMap = ( req, res, done ) => {

	console.log( `fetching media types map` );

	var locals = res.locals;
	// create an area in locals for the media types map
	locals.migration.maps.mediaTypes = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Media Type', field: 'mediaType', value: 'print', mapTo: [ 'P' ], namespace: locals.migration.maps.mediaTypes }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Type', field: 'mediaType', value: 'web', mapTo: [ 'W' ], namespace: locals.migration.maps.mediaTypes }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Type', field: 'mediaType', value: 'TV', mapTo: [ 'T' ], namespace: locals.migration.maps.mediaTypes }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Type', field: 'mediaType', value: 'radio', mapTo: [ 'R' ], namespace: locals.migration.maps.mediaTypes }, done ); }
	
	], () => {

		console.log( `media types map set` );
		done();
	});
}
