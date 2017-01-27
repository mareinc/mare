var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getCityRegionsMap = ( req, res, done ) => {

    console.log( `fetching city regions map` );

    let locals = res.locals;
    // create an area in locals for the city regions map
	locals.migration.maps.cityRegions = {};

    async.series([

        done => { dataMigrationService.mapModelFields( { model: 'City or Town', keyField: 'cityOrTown', valueField: 'region', populateField: 'region', namespace: locals.migration.maps.cityRegions }, done ); }
    
    ], () => {

		console.log( `city regions map set` );
		done();
	});
};