var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getLanguagesMap = ( req, res, done ) => {

	console.log( `fetching languages map` );

	var locals = res.locals;
	// create an area in locals for the languages map
	locals.migration.maps.languages = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Chinese', mapTo: [ 'Chinese' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'English', mapTo: [ 'English' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Portuguese', mapTo: [ 'Portuguese' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Spanish', mapTo: [ 'Spanish' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'other', mapTo: [ 'other' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'ASL', mapTo: [ 'ASL' ], namespace: locals.migration.maps.languages }, done ); }
		
	], () => {

		console.log( `languages map set` );
		done();
	});
};