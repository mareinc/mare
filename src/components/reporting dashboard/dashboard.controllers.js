const keystone 			= require( 'keystone' ),
	  listService		= require( '../lists/list.controllers' ),
	  childService		= require( '../children/child.controllers' );

/* fetch the number of children grouped by regions */
exports.getChildrenNumbersGroupedByRegions = () => {

	return new Promise( ( resolve, reject ) => {
		listService.getAllRegions()
			.then( regions => {
				let promises = [];

				// get promises that count the numbers in each region and for each status
				for( let region of regions ) {
					promises.push( childService.getNumberOfChildrenByStatusNameAndRegionID( 'active', region._id ) );
					promises.push( childService.getNumberOfChildrenByStatusNameAndRegionID( 'on hold', region._id ) );
					promises.push( childService.getNumberOfChildrenByRegionID( region._id ) );
				}

				Promise.all( promises )
					.then( values => {
						let ind = 0,
							response = [];

						// group the results by regions
						for( let region of regions ) {
							let activeCount = values[ ind++ ];
							let onHoldCount = values[ ind++ ];
							let totalCount = values[ ind++ ];
							
							response.push({
								region: region.region,
								active: activeCount,
								onHold: onHoldCount,
								activeAndOnHold: activeCount + onHoldCount,
								total: totalCount
							});
						}

						resolve( response );
					})
					.catch( err => {
						// log the error for debugging purposes
						console.error( `error fetching the number of children in regions`, err );
						// reject the promise
						reject( new Error( `error fetching the number of children in regions - ${ err }` ) );
					});
			})
			.catch( err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of regions`, err );
				// reject the promise
				reject( new Error( `error fetching the list of regions - ${ err }` ) );
			});
			
	});
};