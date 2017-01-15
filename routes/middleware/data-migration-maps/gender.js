var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getGendersMap = ( req, res, done ) => {

	console.log( `fetching genders map` );

	var locals = res.locals;
	// create an area in locals for the genders map
	locals.migration.maps.genders = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Gender', field: 'gender', value: 'female', mapTo: [ 'F' ], namespace: locals.migration.maps.genders }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Gender', field: 'gender', value: 'male', mapTo: [ 'M' ], namespace: locals.migration.maps.genders }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Gender', field: 'gender', value: 'other', mapTo: [ 'O' ], namespace: locals.migration.maps.genders }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Gender', field: 'gender', value: 'transgender', mapTo: [ 'T' ], namespace: locals.migration.maps.genders }, done ); }
		
	], () => {

		console.log( `genders map set` );
		done();
	});
};