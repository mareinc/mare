var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getInquiryMethodsMap = ( req, res, done ) => {

	console.log( `fetching inquiry methods map` );

	var locals = res.locals;
	// create an area in locals for the inquiry methods map
	locals.migration.maps.inquiryMethods = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Inquiry Method', field: 'inquiryMethod', value: 'email', mapTo: [ 'E' ], namespace: locals.migration.maps.inquiryMethods }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Inquiry Method', field: 'inquiryMethod', value: 'in person', mapTo: [ 'I' ], namespace: locals.migration.maps.inquiryMethods }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Inquiry Method', field: 'inquiryMethod', value: 'phone', mapTo: [ 'P' ], namespace: locals.migration.maps.inquiryMethods }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Inquiry Method', field: 'inquiryMethod', value: 'mail', mapTo: [ 'M' ], namespace: locals.migration.maps.inquiryMethods }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Inquiry Method', field: 'inquiryMethod', value: 'website', mapTo: [ 'W' ], namespace: locals.migration.maps.inquiryMethods }, done ); }
		
	], () => {

		console.log( `inquiry methods map set` );
		done();
	});
};