var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getLanguagesMap = ( req, res, done ) => {

	console.log( `fetching languages map` );

	var locals = res.locals;
	// create an area in locals for the languages map
	locals.migration.maps.languages = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Chinese', mapTo: [ 'chinese', 'cantonese', 'mandarin chinese' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'English', mapTo: [ 'english', 'englilsh', 'engish', 'eng', 'bilingual' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Portuguese', mapTo: [ 'portuguese', 'portugese' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Russian', mapTo: [ 'russian' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Spanish', mapTo: [ 'spanish', 'sapanish', 'spansih', 'spanis', 'spanih', 'span', 'spa', 'sp' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'French', mapTo: [ 'french', 'creole', 'french creole' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Haitian Creole', mapTo: [ 'haitiancreole' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'other', mapTo: [ 'other', 'arabic', 'laos', 'khmer', 'grebo', 'greek', 'lebanese' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'non-verbal', mapTo: [ 'non-verbal', 'nonverbal', 'english (non-verbal)' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'ASL', mapTo: [ 'asl', 'sign language' ], namespace: locals.migration.maps.languages }, done ); }
		
	], () => {

		console.log( `languages map set` );
		done();
	});
};