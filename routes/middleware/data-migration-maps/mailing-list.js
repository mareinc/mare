var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getMailingListsMap = ( req, res, done ) => {

	console.log( `fetching mailing lists map` );

	var locals = res.locals;
	// create an area in locals for the states map
	locals.migration.maps.mailingLists = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'adoption parties', mapTo: [ 1 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'family pages', mapTo: [ 3 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'photolisting pages', mapTo: [ 4 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'newsletters', mapTo: [ 5 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'e-mail single parent matching', mapTo: [ 7 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'contracted adoption workers', mapTo: [ 10 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'DCF adoption workers', mapTo: [ 11 ], namespace: locals.migration.maps.mailingLists }, done ); },
		// done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'video libraries', mapTo: [ 12 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'non-DCF/contracted contacts', mapTo: [ 16 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'board of directors', mapTo: [ 32 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'Boston coalition', mapTo: [ 33 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'DCF area/reg. dir. & APMs', mapTo: [ 35 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'honorary board of directors', mapTo: [ 36 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'out of country newsletters', mapTo: [ 38 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'DCF adoption supervisors', mapTo: [ 39 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'contracted adoption sups', mapTo: [ 40 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'contracted exec. directors', mapTo: [ 41 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'adoption mixer families 2002', mapTo: [ 42 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'e-mail newsletter', mapTo: [ 43 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'Heart Gallery 2005', mapTo: [ 1001 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'e-mail adoption parties', mapTo: [ 1002 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'fundraising', mapTo: [ 1003 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'single parent matching night', mapTo: [ 1004 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'Heart Gallery photographers', mapTo: [ 1005 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'Latino families', mapTo: [ 1006 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: '2007 family follow-up project', mapTo: [ 1007 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'former board of directors', mapTo: [ 1008 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'statewide recruitment', mapTo: [ 1010 ], namespace: locals.migration.maps.mailingLists }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Mailing List', field: 'mailingList', value: 'AUKFY 2015', mapTo: [ 1011 ], namespace: locals.migration.maps.mailingLists }, done ); }
	
	], () => {

		console.log( `outside mailing lists map set` );
		done();
	});
}
