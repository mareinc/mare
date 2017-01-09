var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getOutsideContactGroupsMap = ( req, res, done ) => {

	console.log( `fetching outside contact groups map` );

	var locals = res.locals;
	// create an area in locals for the states map
	locals.migration.maps.outsideContactGroups = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'adoption parties', mapTo: [ 1 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'family pages', mapTo: [ 3 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'photolisting pages', mapTo: [ 4 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'newsletters', mapTo: [ 5 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'e-mail single parent matching', mapTo: [ 7 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'contracted adoption workers', mapTo: [ 10 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'DCF adoption workers', mapTo: [ 11 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'video libraries', mapTo: [ 12 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'non-DCF/contracted contacts', mapTo: [ 16 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'board of directors', mapTo: [ 32 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'Boston coalition', mapTo: [ 33 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'DCF area/reg. dir. & APMs', mapTo: [ 35 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'honorary board of directors', mapTo: [ 36 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'out of country newsletters', mapTo: [ 38 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'DCF adoption supervisors', mapTo: [ 39 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'contracted adoption sups', mapTo: [ 40 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'contracted exec. directors', mapTo: [ 41 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'adoption mixer families 2002', mapTo: [ 42 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'e-mail newsletter', mapTo: [ 43 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'Heart Gallery 2005', mapTo: [ 1001 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'e-mail adoption parties', mapTo: [ 1002 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'fundraising', mapTo: [ 1003 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'single parent matching night', mapTo: [ 1004 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'Heart Gallery photographers', mapTo: [ 1005 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'Latino families', mapTo: [ 1006 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: '2007 family follow-up project', mapTo: [ 1007 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'former board of directors', mapTo: [ 1008 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'statewide recruitment', mapTo: [ 1010 ], namespace: locals.migration.maps.outsideContactGroups }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Outside Contact Group', field: 'name', value: 'AUKFY 2015', mapTo: [ 1011 ], namespace: locals.migration.maps.outsideContactGroups }, done ); }
	
	], () => {

		console.log( `outside contact groups map set` );
		done();
	});
}
