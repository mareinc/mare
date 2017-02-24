var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getContactGroupsMap = ( req, res, done ) => {

	console.log( `fetching contact groups map` );

	var locals = res.locals;
	// create an area in locals for the states map
	locals.migration.maps.contactGroups = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Contact Group', field: 'name', value: 'other', mapTo: [ 1, 2, 5 ], namespace: locals.migration.maps.contactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Contact Group', field: 'name', value: 'agencies', mapTo: [ 3 ], namespace: locals.migration.maps.contactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Contact Group', field: 'name', value: 'libraries', mapTo: [ 4 ], namespace: locals.migration.maps.contactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Contact Group', field: 'name', value: 'religious organizations', mapTo: [ 6 ], namespace: locals.migration.maps.contactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Contact Group', field: 'name', value: 'volunteers', mapTo: [ 7 ], namespace: locals.migration.maps.contactGroups }, done ); }
	
	], () => {

		console.log( `contact groups map set` );
		done();
	});
}
