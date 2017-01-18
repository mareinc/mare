var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getLanguagesMap = ( req, res, done ) => {

	console.log( `fetching languages map` );

	var locals = res.locals;
	// create an area in locals for the languages map
	locals.migration.maps.languages = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Chinese', mapTo: [ 'chinese', 'cantonese', 'mandarin chinese' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'English', mapTo: [ 'english', 'eng' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Portuguese', mapTo: [ 'portuguese' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Russian', mapTo: [ 'russian' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'Spanish', mapTo: [ 'spanish', 'spanis', 'span', 'spa', 'sp' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'other', mapTo: [ 'other', 'non-verbal', 'nonverbal', 'laos', 'khmer', 'grebo', 'creole', 'english (non-verbal)' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'sign language', mapTo: [ 'sign language' ], namespace: locals.migration.maps.languages }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Language', field: 'language', value: 'ASL', mapTo: [ 'asl' ], namespace: locals.migration.maps.languages }, done ); }
		
	], () => {

		console.log( `languages map set` );
		done();
	});
};