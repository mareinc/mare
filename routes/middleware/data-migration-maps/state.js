const dataMigrationService	= require( '../service_data-migration' );
const async					= require( 'async' );

exports.getStatesMap = ( req, res, done ) => {

	console.log( `fetching states map` );

	var locals = res.locals;
	// create an area in locals for the states map
	locals.migration.maps.states = {};

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Alabama', mapTo: [ 'AL' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Alaska', mapTo: [ 'AK' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Arizona', mapTo: [ 'AZ' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Arkansas', mapTo: [ 'AR' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'California', mapTo: [ 'CA' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Colorado', mapTo: [ 'CO' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Connecticut', mapTo: [ 'CT' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Delaware', mapTo: [ 'DE' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Florida', mapTo: [ 'FL' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Georgia', mapTo: [ 'GA' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Hawaii', mapTo: [ 'HI' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Idaho', mapTo: [ 'ID' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Illinois', mapTo: [ 'IL' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Indiana', mapTo: [ 'IN' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'International', mapTo: [ 'I' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Iowa', mapTo: [ 'IA' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Kansas', mapTo: [ 'KS' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Kentucky', mapTo: [ 'KY' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Louisiana', mapTo: [ 'LA' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Maine', mapTo: [ 'ME' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Maryland', mapTo: [ 'MD' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Massachusetts', mapTo: [ 'MA' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Michigan', mapTo: [ 'MI' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Minnesota', mapTo: [ 'MN' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Mississippi', mapTo: [ 'MS' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Missouri', mapTo: [ 'MO' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Montana', mapTo: [ 'MT' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Nebraska', mapTo: [ 'NE' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Nevada', mapTo: [ 'NV' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'New Hampshire', mapTo: [ 'NH' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'New Jersey', mapTo: [ 'NJ' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'New Mexico', mapTo: [ 'NM' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'New York', mapTo: [ 'NY' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'North Carolina', mapTo: [ 'NC' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'North Dakota', mapTo: [ 'ND' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Ohio', mapTo: [ 'OH' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Oklahoma', mapTo: [ 'OK' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Oregon', mapTo: [ 'OR' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Pennsylvania', mapTo: [ 'PA' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Puerto Rico', mapTo: [ 'PR' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Rhode Island', mapTo: [ 'RI' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'South Carolina', mapTo: [ 'SC' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'South Dakota', mapTo: [ 'SD' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Tennessee', mapTo: [ 'TN' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Texas', mapTo: [ 'TX' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Utah', mapTo: [ 'UT' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Vermont', mapTo: [ 'VT' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Virginia', mapTo: [ 'VA' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Washington', mapTo: [ 'WA' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Washington DC', mapTo: [ 'DC' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'West Virginia', mapTo: [ 'WV' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Wisconsin', mapTo: [ 'WI' ], namespace: locals.migration.maps.states }, done ); },
		done => { dataMigrationService.getModelId( { model: 'State', field: 'state', value: 'Wyoming', mapTo: [ 'WY' ], namespace: locals.migration.maps.states }, done ); }

	], () => {

		console.log( `states map set` );
		done();
	});
}
