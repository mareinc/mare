exports.getDisabilitiesMap = ( req, res, done ) => {

	console.log( `setting disabilities map` );

	var locals = res.locals;
	// create an area in locals for the disabilities map
	locals.migration.maps.disabilities = {
		10: 'none',
		20: 'mild',
		30: 'moderate',
		40: 'severe'
	};

	console.log( `disabilities map set` );
	done();
};