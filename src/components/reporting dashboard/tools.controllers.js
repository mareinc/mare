const keystone 				= require( 'keystone' ),
	  flashMessages			= require( '../../utils/notification.middleware' ),
	  listService			= require( '../lists/list.controllers' ),
	  childService			= require( '../children/child.controllers' ),
	  familyService			= require( '../families/family.controllers' ),
	  socialWorkerService	= require( '../social workers/social-worker.controllers' ),
	  agenciesService		= require( '../agencies/agency.controllers' ),
	  ObjectId 				= require('mongodb').ObjectId,
	  moment				= require( 'moment' ),
	  _						= require( 'underscore' ),
	  dashboardService		= require( './dashboard.controllers' ),
	  childMatchingService	= require( './child-matching.controllers' ),
	  utilsService			= require( './utils.controllers' );


exports.getChildMatchingData = ( req, res, next ) => {
	const userType	= req.user ? req.user.userType : '',
			childID = req.query.childID;
	
	// access for admins only
	if ( userType.length === 0 || userType !== 'admin' ) {
		res.statusCode = 403;
		res.setHeader( 'Content-Type', 'text/plain' );
		res.end( 'Access denied' );
		return;
	}
	
	let fetchChild = childService.getChildById( { id: childID } ),
		criteria = childMatchingService.getValidCriteria( req.query ),
		resultsPromise = childMatchingService.getResultsPromise( criteria );

	// fetch the social workers and agencies for rendering purposes on the client side
	let fetchSocialWorkers = Array.isArray( req.query.socialWorkers ) ? socialWorkerService.getSocialWorkersByIds( req.query.socialWorkers ) : [],
		fetchAgencies = Array.isArray( req.query.socialWorkersAgency ) ? agenciesService.getAgenciesByIds( req.query.socialWorkersAgency ) : [];

	Promise.all( [ fetchChild, fetchSocialWorkers, fetchAgencies, resultsPromise ] )
		.then( values => {
			let result = {};
			
			// assign local variables to the values returned by the promises
			const [ child, socialWorkers, agencies, results ] = values;
			
			// output requested child record details
			result.child = childMatchingService.extractChildData( child );
			
			// if no criteria were detected prepare and send the default parameters set based on the child record
			if ( _.isEmpty( criteria ) ) {
				let fetchSocialWorkers = child.adoptionWorker ? socialWorkerService.getSocialWorkersByIds( [ child.adoptionWorker.toString() ] ) : [],
					fetchAgencies = child.adoptionWorkerAgency ? agenciesService.getAgenciesByIds( [ child.adoptionWorkerAgency.toString() ] ) : [],
					params = {};
				
				Promise.all( [ fetchSocialWorkers, fetchAgencies ] )
					.then( values => {
						const [ socialWorkers, agencies ] = values;
						
						// collect the default parameters
						params.status = [ child.status.toString() ];
						params.gender = [ child.gender.toString() ];
						params.race = Array.isArray( child.race ) ? child.race.map( ( race ) => race.toString() ) : [];
						params.legalStatus = child.legalStatus ?  [ child.legalStatus.toString() ] : [];
						params.familyConstellation = Array.isArray( child.recommendedFamilyConstellation ) ? child.recommendedFamilyConstellation.map( ( constellation ) => constellation.toString() ) : [];
						params.agesFrom = child.birthDate ? moment().diff( child.birthDate, 'years' ) : '';
						params.siblingGroupSizeFrom = child.siblings ? child.siblings.length : '';
						params.physicalNeedsFrom = child.physicalNeeds ? child.physicalNeeds : '';
						params.intellectualNeedsFrom = child.intellectualNeeds ? child.intellectualNeeds : '';
						params.emotionalNeedsFrom = child.emotionalNeeds ? child.emotionalNeeds : '';
				
						result.params = params;
						
						// append the social workers and agencies for rendering purposes on the client side
						result.socialWorkers = childMatchingService.extractSocialWorkersData( socialWorkers );
						result.socialWorkersAgencies = childMatchingService.extractAgenicesData( agencies );
						
						res.send( result );
					})
					.catch( err => {
						console.error( `error loading the default parameters for the child matching report - ${ err }` );

						utilsService.sendErrorFlashMessage( res, 'Error', 'Error loading the default parameters' );
					});
			} else {
				// if criteria were detected send the results
				result.socialWorkers = childMatchingService.extractSocialWorkersData( socialWorkers );
				result.socialWorkersAgencies = childMatchingService.extractAgenicesData( agencies );
				result.results = childMatchingService.sortResults( childMatchingService.processResults( results, criteria ) );
				
				// send the results in PDF format if 'pdf' parameter was detected in the query string
				if ( req.query.pdf ) {
					childMatchingService.sendPDF( req, res, result.results );
				} else {
					res.send( result );
				}
			}

		})
		.catch( err => {
			console.error( `error loading data for the child matching report - ${ err }` );
			
			utilsService.sendErrorFlashMessage( res, 'Error', 'Error loading the data' );
		});
}

exports.saveFamiliesMatchingHistory = ( req, res, next ) => {
	const childID = req.body.childID;
	
	if ( ! Array.isArray( req.body.ids ) || req.body.ids.length === 0 ) {
		utilsService.sendErrorFlashMessage( res, 'Error', 'There are no entries selected' );
		return;
	}
	
	childService.getChildById( { id: childID } ).then( child => {
		familyService.getFamiliesByIds( req.body.ids ).then( families => {
			let tasks = [],
				allChildrenIDs = [ childID ];
			
			// append all siblings:
			if ( Array.isArray( child.siblingsToBePlacedWith ) ) {
				child.siblingsToBePlacedWith.forEach( ( sibling ) => {
					allChildrenIDs.push( sibling.toString() );
				});
			}
			
			families.forEach( family => {
				allChildrenIDs.forEach( ( targetChildID ) => {
					const FamilyMatchingHistory = keystone.list( 'Family Matching History' ),
						familyMatchingHistory = new FamilyMatchingHistory.model({
							child: ObjectId( targetChildID ),
							family: family,
							createdBy: req.user,
							homestudySent: false,
							registrationNumber: family.registrationNumber
						});
					
					tasks.push( familyMatchingHistory.save() );
				});
			});
			
			Promise.all( tasks )
				.then( ( results ) => {
					utilsService.sendSuccessFlashMessage( res, 'Information', 'All entries have been saved' );
				})
				.catch( err => {
					console.error( `error saving family matching histories - ${ err }` );
					
					utilsService.sendErrorFlashMessage( res, 'Error', 'Error saving history entries' );
				});
		})
		.catch( err => {
			console.error( `error loading families - ${ err }` );
			
			utilsService.sendErrorFlashMessage( res, 'Error', 'Error saving history entries' );
		});
	})
	.catch( err => {
		console.error( `error saving family matching histories - could not load the child record- ${ err }` );
		
		utilsService.sendErrorFlashMessage( res, 'Error', 'Error saving history entries' );
	});
};










function getObjects( modelName, mapFunction ) {
	
	return new Promise( ( resolve, reject ) => {
		keystone.list( modelName ).model
			.find()
			.exec()
			.then( results => {
				resolve( results.map( mapFunction ) );
			}, err => {
				reject( err );
			});
	});
	
}

function getRangeFromArrayOfNoneEmptyStrings( array, fromElement, toElement ) {
	let include = typeof fromElement === 'undefined' || fromElement.length === 0;
	let forceDontInclude = false;
	let results = [];
	
	array.forEach( ( item ) => {
		if ( item === fromElement && ! forceDontInclude ) {
			include = true;
		}
		if ( include ) {
			results.push( item );
		}
		if ( item === toElement ) {
			include = false;
			forceDontInclude = true;
		}
	});
	
	return results;
}

exports.getChildStatusesOptions = ( currentValues, selectDefault ) => {
	
	return getObjects( 'Child Status', ( value ) => {
		
			let selected = false;
			if ( selectDefault === true ) {
				selected = value.childStatus == 'active';
			} else {
				selected = Array.isArray( currentValues ) ? currentValues.includes( value._id.toString() ) : false;
			}
		
			return {
				id: value._id.toString(),
				name: value.childStatus,
				selected: selected
			}
		}
	);
	
};

exports.getGendersOptions = ( currentValues ) => {
	
	return getObjects( 'Gender', ( value ) => {
			return {
				id: value._id.toString(),
				name: value.gender,
				selected: Array.isArray( currentValues ) ? currentValues.includes( value._id.toString() ) : false
			}
		}
	);
	
};

exports.getRacesOptions = ( currentValues ) => {
	return getObjects( 'Race', ( value ) => {
			return {
				id: value._id.toString(),
				name: value.race,
				selected: Array.isArray( currentValues ) ? currentValues.includes( value._id.toString() ) : false
			}
		}
	);
	
};

exports.getLegalStatusesOptions = ( currentValues ) => {
	
	return getObjects( 'Legal Status', ( value ) => {
			return {
				id: value._id.toString(),
				name: value.legalStatus,
				selected: Array.isArray( currentValues ) ? currentValues.includes( value._id.toString() ) : false
			}
		}
	);
	
};

exports.getFamilyConstellationsOptions = ( currentValues ) => {
	
	return getObjects( 'Family Constellation', ( value ) => {
			return {
				id: value._id.toString(),
				name: value.familyConstellation,
				selected: Array.isArray( currentValues ) ? currentValues.includes( value._id.toString() ) : false
			}
		}
	);
	
};

exports.getAgesOptions = ( currentValue ) => {
	const MAX_AGE = 21;
	let results = [];
	let currentValueParsed = parseInt( currentValue );
	
	for ( let i = 0; i < MAX_AGE; i++  ) {
		results.push( {
			id: i,
			name: i,
			selected: i === currentValueParsed
		});
	}
	
	return results;
};

exports.getSiblingGroupSizesOptions = ( currentValue ) => {
	const MAX_SIZE = 10;
	let results = [];
	let currentValueParsed = parseInt( currentValue );
	
	for ( let i = 1; i < MAX_SIZE; i++  ) {
		results.push( {
			id: i,
			name: i,
			selected: i === currentValueParsed
		});
	}
	
	return results;
};

const PHYSICAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.getPhysicalNeedsOptions = ( currentValue ) => {
	return PHYSICAL_NEEDS_OPTIONS.map( ( value ) => {
		return {
			id: value,
			name: value,
			selected: value === currentValue
		}
	});
	
};

exports.getPhysicalNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( PHYSICAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

const INTELLECTUAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.getIntellectualNeedsOptions = ( currentValue ) => {
	return INTELLECTUAL_NEEDS_OPTIONS.map( ( value ) => {
		return {
			id: value,
			name: value,
			selected: value === currentValue
		}
	});
	
};
exports.getIntellectualNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( INTELLECTUAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

const EMOTIONAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.getEmotionalNeedsOptions = ( currentValue ) => {
	return EMOTIONAL_NEEDS_OPTIONS.map( ( value ) => {
		return {
			id: value,
			name: value,
			selected: value === currentValue
		}
	});
	
};
exports.getEmotionalNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( EMOTIONAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

const SOCIAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.getSocialNeedsOptions = ( currentValue ) => {
	return SOCIAL_NEEDS_OPTIONS.map( ( value ) => {
		return {
			id: value,
			name: value,
			selected: value === currentValue
		}
	});
};
exports.getSocialNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( SOCIAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getAgenciesOptions = ( currentValues ) => {
	
	let mapFunction = ( value ) => {
		return {
			id: value._id,
			name: value.name
		}
	};
	
	return new Promise( ( resolve, reject ) => {
		keystone.list( 'Agency' ).model
			.find( {
				'_id': { $in: Array.isArray(currentValues) ? currentValues : [] }
			})
			.exec()
			.then( results => {
				resolve( results.map( mapFunction ) );
			}, err => {
				reject( err );
			});
	});
	
};

exports.getSocialWorkersOptions = ( currentValues ) => {
	
	let mapFunction = ( value ) => {
		return {
			id: value._id.toString(),
			name: value.name.full
		}
	};
	
	return new Promise( ( resolve, reject ) => {
		keystone.list( 'Social Worker' ).model
			.find( {
				'_id': { $in: Array.isArray(currentValues) ? currentValues : [] }
			})
			.exec()
			.then( results => {
				resolve( results.map( mapFunction ) );
			}, err => {
				reject( err );
			});
	});
	
};

exports.getAgenciesData = ( req, res, next ) => {
	const MAX_RESULTS = 10;
	let query = req.query.q;
	
	keystone.list( 'Agency' ).model
		.find( { 'name' : new RegExp( query, 'i' ) } )
		.sort( { 'name' : 'asc' } )
		.limit( MAX_RESULTS )
		.exec()
		.then( results => {
			res.send( { 
				results: results.map( ( agency ) => {
					return {
						id: agency._id.toString(),
						text: agency.name
					}
				}),
				pagination: { more: false } 
			});
		}, err => {
			res.send( { results: [], pagination: { more: false } } );
		});
	
};

exports.getSocialWorkersData = ( req, res, next ) => {
	const MAX_RESULTS = 10;
	let query = req.query.q;
	
	keystone.list( 'Social Worker' ).model
		.find( { 'name.full' : new RegExp( query, 'i' ) } )
		.sort( { 'name.full' : 'asc' } )
		.limit( MAX_RESULTS )
		.exec()
		.then( results => {
			res.send( { 
				results: results.map( ( socialWorker ) => {
					return {
						id: socialWorker._id.toString(),
						text: socialWorker.name.full
					}
				}),
				pagination: { more: false } 
			});
		}, err => {
			res.send( { results: [], pagination: { more: false } } );
		});
	
};

exports.getFamiliesData = ( req, res, next ) => {
	const MAX_RESULTS = 10;
	let query = req.query.q;
	
	keystone.list( 'Family' ).model
		.find( { 'displayNameAndRegistration' : new RegExp( query, 'i' ) } )
		.sort( { 'displayNameAndRegistration' : 'asc' } )
		.limit( MAX_RESULTS )
		.exec()
		.then( results => {
			res.send( { 
				results: results.map( ( family ) => {
					return {
						id: family._id.toString(),
						text: family.displayNameAndRegistration
					}
				}),
				pagination: { more: false } 
			});
		}, err => {
			res.send( { results: [], pagination: { more: false } } );
		});
	
};

exports.getChildrenData = ( req, res, next ) => {
	const MAX_RESULTS = 10;
	let query = req.query.q;
	
	keystone.list( 'Child' ).model
		.find( { 'displayNameAndRegistration' : new RegExp( query, 'i' ) } )
		.sort( { 'displayNameAndRegistration' : 'asc' } )
		.limit( MAX_RESULTS )
		.exec()
		.then( results => {
			res.send( { 
				results: results.map( ( child ) => {
					return {
						id: child._id.toString(),
						text: child.displayNameAndRegistration
					}
				}),
				pagination: { more: false } 
			});
		}, err => {
			res.send( { results: [], pagination: { more: false } } );
		});
	
};

exports.saveChildrenMatchingHistory = ( req, res, next ) => {
	
	const familyID = req.body.familyID;
	
	
	childService.getChildrenByIds( req.body.ids ).then( children => {
		let tasks = [];
		
		children.forEach( child => {
			
			const ChildMatchingHistory = keystone.list( 'Child Matching History' );
			const childMatchingHistory = new ChildMatchingHistory.model({
				family: ObjectId( familyID ),
				child: child,
				createdBy: req.user,
				homestudySent: false,
				registrationNumber: child.registrationNumber
			});
			
			tasks.push( childMatchingHistory.save() );
		});
		
		Promise.all(tasks)
			.then( (results) => {
				res.send( { status: 'OK' } );
			})
			.catch( err => {
				console.error( `error saving child matching histories - ${ err }` );
				
				res.send( { status: 'ERROR', message: 'Error saving history entries' } );
			});
		
		
	})
	.catch( err => {
		console.error( `error loading children - ${ err }` );
		
		res.send( { status: 'ERROR', message: 'Error loading children' } );
	});
	
};



exports.getDashboardData = ( req, res, next ) => {
	const userType	= req.user ? req.user.userType : '',
		  daysRange = 30;
	
	// access for admins only
	if ( userType.length === 0 || userType !== 'admin' ) {
		res.statusCode = 403;
		res.setHeader( 'Content-Type', 'text/plain' );
		res.end( 'Access denied' );
		return;
	}
	
	let result = {};
	let fromDate = typeof req.query.fromDate !== 'undefined' ? req.query.fromDate : moment().subtract(daysRange, "days").format( 'YYYY-MM-DD' );
	let toDate = typeof req.query.toDate !== 'undefined' ? req.query.toDate : moment().format( 'YYYY-MM-DD' );
	let ytdFromDate = ( moment().month() >= 7 ? moment().year() : moment().year() - 1 ) + '-07-01';
	
	result.fromDate = fromDate;
	result.toDate = toDate;
	
	let getNumberOfFamilies = dashboardService.getNumberOfModels( 'Family', fromDate, toDate, 'createdAt' ),
		getNumberOfChildren = dashboardService.getNumberOfModels( 'Child', fromDate, toDate, 'createdAt' ),
		getNumberOfInquiries = dashboardService.getNumberOfModels( 'Inquiry', fromDate, toDate, 'takenOn' ),
		getNumberOfPlacements = dashboardService.getNumberOfModels( 'Placement', ytdFromDate, toDate, 'placementDate' ),
		getNumberOfActiveChildren = dashboardService.getNumberOfChildrenByStatusNameAndRegionID( 'active', undefined ),
		getNumberOfOnHoldChildren = dashboardService.getNumberOfChildrenByStatusNameAndRegionID( 'on hold', undefined ),
		getNumberOfAllChildren = dashboardService.getNumberOfChildrenByRegionID( undefined ),
		getChildrenNumbersGroupedByRegions = dashboardService.getChildrenNumbersGroupedByRegions( );
	
	Promise.all( [ getNumberOfFamilies, getNumberOfChildren, getNumberOfInquiries, getNumberOfPlacements, getNumberOfActiveChildren, getNumberOfOnHoldChildren, getNumberOfAllChildren, getChildrenNumbersGroupedByRegions ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ numberOfFamilies, numberOfChildren, numberOfInquiries, numberOfPlacements, numberOfActiveChildren, numberOfOnHoldChildren, numberOfAllChildren, childrenNumbersGroupedByRegions ] = values;
			
			result.numberOfFamilies = numberOfFamilies;
			result.numberOfChildren = numberOfChildren;
			result.numberOfInquiries = numberOfInquiries;
			result.numberOfPlacements = numberOfPlacements;
			result.numberOfActiveChildren = numberOfActiveChildren;
			result.numberOfOnHoldChildren = numberOfOnHoldChildren;
			result.numberOfActiveAndOnHoldChildren = numberOfActiveChildren + numberOfOnHoldChildren;
			result.numberOfAllChildren = numberOfAllChildren;
			result.childrenNumbersGroupedByRegions = childrenNumbersGroupedByRegions;

			res.send( result );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the dashboard - ${ err }` );

			res.send( { status: 'ERROR', message: 'Error loading the dashboard data' } );
		});
};
