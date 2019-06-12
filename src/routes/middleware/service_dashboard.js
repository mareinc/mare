const keystone 			= require( 'keystone' ),
	  listsService		= require( '../../components/lists/list.controllers' );
	  
	  
function getChildStatusByName(name) {
	return new Promise( ( resolve, reject ) => {

		if( !name ) {
			return reject( 'no name provided' );
		}

		keystone.list( 'Child Status' ).model
			.findOne()
			.where( 'childStatus' ).equals( name )
			.lean()
			.exec()
			.then( childStatus => {
				if( !childStatus ) {
					return reject( `status could not be found` );
				}
				
				resolve( childStatus );
			}, err => {
				reject( err );
			});
	});
};

exports.getNumberOfModels = ( modelName, fromDate, toDate, dateFieldName ) => {
	return new Promise( ( resolve, reject ) => {
		keystone.list( modelName ).model
			.count({
				[ dateFieldName ] : { "$gte": new Date( fromDate + "T00:00:00.000Z" ), "$lte": new Date( toDate + "T00:00:00.000Z" ) }
			})
			.exec()
			.then( total => {
				resolve( total );
			}, err => {
				reject( err );
			});
	});
};

exports.getNumberOfChildrenByStatusNameAndRegionID = ( statusName, regionID ) => {
	return new Promise( ( resolve, reject ) => {
		getChildStatusByName( statusName )
			.then( childStatus => {
				let conditions = {
					status: childStatus
				};
				
				if ( typeof regionID !== 'undefined' ) {
					conditions['adoptionWorkerAgencyRegion'] = regionID;
				}
				
				keystone.list( 'Child' ).model
					.count(conditions)
					.exec()
					.then( total => {
						resolve( total );
					}, err => {
						reject( err );
					});
			})
			.catch( err => {
				console.error( `error loading status - ${ err }` );
				reject( err );
			});
	});
};

exports.getNumberOfChildrenByRegionID = ( regionID ) => {
	return new Promise( ( resolve, reject ) => {
		let conditions = { };
		
		if ( typeof regionID !== 'undefined' ) {
			conditions = { adoptionWorkerAgencyRegion: regionID };
		}
		
		keystone.list( 'Child' ).model
			.count(conditions)
			.exec()
			.then( total => {
				resolve( total );
			}, err => {
				reject( err );
			});
	});
};

exports.getChildrenNumbersGroupedByRegions = ( ) => {
	return new Promise( ( resolve, reject ) => {
		listsService.getAllRegions()
			.then( regions => {
				let promises = [];
				
				for( let region of regions ) {
					promises.push( exports.getNumberOfChildrenByStatusNameAndRegionID( 'active', region._id ) );
					promises.push( exports.getNumberOfChildrenByStatusNameAndRegionID( 'on hold', region._id ) );
					promises.push( exports.getNumberOfChildrenByRegionID( region._id ) );
				}
				
				Promise.all( promises )
					.then( values => {
						let ind = 0,
							response = [];
						
						for( let region of regions ) {
							let activeCount = values[ind++];
							let onHoldCount = values[ind++];
							let totalCount = values[ind++];
							
							response.push( {
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
						console.error( `error fetching the numbers of regions - ${ err }` );
						reject();
					});
			})
			.catch( err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of regions - ${ err }` );
				// reject the promise
				reject();
			});
			
	});
};