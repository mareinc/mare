exports.getDisabilityStatusesMap = ( req, res, done ) => {

	console.log( `setting disability statuses map` );

	var locals = res.locals;
	// create an area in locals for the disabilities map
	locals.migration.maps.disabilityStatuses = {
		10: 'none',
		20: 'mild',
		30: 'moderate',
		40: 'severe'
	};

	console.log( `disability statuses map set` );
	done();
};