const keystone 				= require( 'keystone' ),
	  modelUtilsService		= require( '../../utils/model.controllers' ),
	  childService			= require( '../children/child.controllers' ),
	  familyService			= require( '../families/family.controllers' ),
	  socialWorkerService	= require( '../social workers/social-worker.controllers' ),
	  agenciesService		= require( '../agencies/agency.controllers' ),
	  ObjectId 				= require('mongodb').ObjectId,
	  moment				= require( 'moment' ),
	  _						= require( 'underscore' ),
	  dashboardService		= require( './dashboard.controllers' ),
	  childMatchingService	= require( './child-matching.controllers' ),
	  familyMatchingService	= require( './family-matching.controllers' ),
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
						result.socialWorkers = utilsService.extractSocialWorkersData( socialWorkers );
						result.socialWorkersAgencies = utilsService.extractAgenicesData( agencies );
						
						res.send( result );
					})
					.catch( err => {
						console.error( `error loading the default parameters for the child matching report - ${ err }` );

						utilsService.sendErrorFlashMessage( res, 'Error', 'Error loading the default parameters' );
					});
			} else {
				// if criteria were detected send the results
				result.socialWorkers = utilsService.extractSocialWorkersData( socialWorkers );
				result.socialWorkersAgencies = utilsService.extractAgenicesData( agencies );
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

exports.getFamilyMatchingData = ( req, res, next ) => {
	const userType	= req.user ? req.user.userType : '',
			familyID = req.query.familyID;
	
	// access for admins only
	if ( userType.length === 0 || userType !== 'admin' ) {
		res.statusCode = 403;
		res.setHeader( 'Content-Type', 'text/plain' );
		res.end( 'Access denied' );
		return;
	}
	
	let fetchFamily = familyService.getFamilyById( familyID ),
		criteria = familyMatchingService.getValidCriteria( req.query ),
		resultsPromise = familyMatchingService.getResultsPromise( criteria );

	// fetch the social workers and agencies for rendering purposes on the client side
	let fetchAdoptionWorkers = Array.isArray( req.query.adoptionWorkers ) ? socialWorkerService.getSocialWorkersByIds( req.query.adoptionWorkers ) : [],
		fetchRecruitmentWorkers = Array.isArray( req.query.recruitmentWorkers ) ? socialWorkerService.getSocialWorkersByIds( req.query.recruitmentWorkers ) : [],
		fetchAdoptionWorkersAgency = Array.isArray( req.query.adoptionWorkersAgency ) ? agenciesService.getAgenciesByIds( req.query.adoptionWorkersAgency ) : [],
		fetchRecruitmentWorkersAgency = Array.isArray( req.query.recruitmentWorkersAgency ) ? agenciesService.getAgenciesByIds( req.query.recruitmentWorkersAgency ) : [];

	Promise.all( [ fetchFamily, fetchAdoptionWorkers, fetchRecruitmentWorkers, fetchAdoptionWorkersAgency, fetchRecruitmentWorkersAgency, resultsPromise ] )
		.then( values => {
			let result = {};
			
			// assign local variables to the values returned by the promises
			const [ family, adoptionWorkers, recruitmentWorkers, adoptionWorkersAgency, recruitmentWorkersAgency, results ] = values;
			
			// output requested child record details
			result.family = familyMatchingService.extractFamilyData( family );
			
			// if no criteria were detected prepare and send the default parameters set based on the child record
			if ( _.isEmpty( criteria ) ) {
				let fetchAdoptionWorkers = family.socialWorker ? socialWorkerService.getSocialWorkersByIds( [ family.socialWorker.toString() ] ) : [],
					fetchAdoptionWorkersAgency = family.socialWorkerAgency ? agenciesService.getAgenciesByIds( [ family.socialWorkerAgency.toString() ] ) : [],
					params = {};
					
				Promise.all( [ fetchAdoptionWorkers, fetchAdoptionWorkersAgency ] )
					.then( values => {
						const [ adoptionWorkers, adoptionWorkersAgency ] = values;
								preferences = family.matchingPreferences;
						
						// collect the default parameters
						params.gender = Array.isArray( preferences.gender ) && preferences.gender.length > 0 ? preferences.gender.map( ( gender ) => gender.toString() ) : [];
						params.race = Array.isArray( preferences.race ) && preferences.race.length > 0  ? preferences.race.map( ( race ) => race.toString() ) : [];
						params.legalStatus = Array.isArray( preferences.legalStatus ) && preferences.legalStatus.length > 0 ? preferences.legalStatus.map( ( legalStatus ) => legalStatus.toString() ) : [];
						params.familyConstellation = family.familyConstellation ? [ family.familyConstellation.toString() ] : [];
						params.agesFrom = preferences.adoptionAges.from ? preferences.adoptionAges.from : '';
						params.agesTo = preferences.adoptionAges.to ? preferences.adoptionAges.to : '';
						params.siblingGroupSizeFrom = preferences.minNumberOfChildrenToAdopt ? preferences.minNumberOfChildrenToAdopt : '';
						params.siblingGroupSizeTo = preferences.maxNumberOfChildrenToAdopt ? preferences.maxNumberOfChildrenToAdopt : '';
						params.physicalNeedsFrom = preferences.maxNeeds.physical ? preferences.maxNeeds.physical : '';
						params.intellectualNeedsFrom = preferences.maxNeeds.intellectual ? preferences.maxNeeds.intellectual : '';
						params.emotionalNeedsFrom = preferences.maxNeeds.emotional ? preferences.maxNeeds.emotional : '';
						
						result.params = params;
						
						// append the social workers and agencies for rendering purposes on the client side
						result.adoptionWorkers = utilsService.extractSocialWorkersData( adoptionWorkers );
						result.adoptionWorkersAgency = utilsService.extractAgenicesData( adoptionWorkersAgency );
						
						res.send( result );
					})
					.catch( err => {
						console.error( `error loading the default parameters for the family matching report - ${ err }` );

						utilsService.sendErrorFlashMessage( res, 'Error', 'Error loading the default parameters' );
					});
			} else {
				// if criteria were detected send the results
				result.adoptionWorkers = utilsService.extractSocialWorkersData( adoptionWorkers );
				result.recruitmentWorkers = utilsService.extractSocialWorkersData( recruitmentWorkers );
				result.adoptionWorkersAgency = utilsService.extractAgenicesData( adoptionWorkersAgency );
				result.recruitmentWorkersAgency = utilsService.extractAgenicesData( recruitmentWorkersAgency );
				
				result.fields = familyMatchingService.getFieldsFromQuery( req.query );
				result.fieldNames = familyMatchingService.getReportFieldNamesFromQuery( req.query );
				
				result.results = familyMatchingService.sortResults( familyMatchingService.processResults( results, criteria, result.fields ) );
				
				// send the results in PDF format if 'pdf' parameter was detected in the query string
				if ( req.query.pdf ) {
					familyMatchingService.sendPDF( req, res, result.results );
				} else {
					res.send( result );
				}
			}

		})
		.catch( err => {
			console.error( `error loading data for the family matching report - ${ err }` );
			
			utilsService.sendErrorFlashMessage( res, 'Error', 'Error loading the data' );
		});
}

exports.saveChildrenMatchingHistory = ( req, res, next ) => {
	const familyID = req.body.familyID;
	
	if ( ! Array.isArray( req.body.ids ) || req.body.ids.length === 0 ) {
		utilsService.sendErrorFlashMessage( res, 'Error', 'There are no entries selected' );
		return;
	}
	
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
		
		Promise.all( tasks )
			.then( ( results ) => {
				utilsService.sendSuccessFlashMessage( res, 'Information', 'All entries have been saved' );
			})
			.catch( err => {
				console.error( `error saving child matching histories - ${ err }` );
				
				utilsService.sendErrorFlashMessage( res, 'Error', 'Error saving history entries' );
			});
	})
	.catch( err => {
		console.error( `error loading children - ${ err }` );
		
		utilsService.sendErrorFlashMessage( res, 'Error', 'Error saving history entries' );
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
			console.error( `error while loading agencies - ${ err }` );
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
			console.error( `error while loading social workers - ${ err }` );
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
			console.error( `error while loading families - ${ err }` );
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
			console.error( `error while loading children - ${ err }` );
			res.send( { results: [], pagination: { more: false } } );
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
	
	let result = {},
		fromDate = typeof req.query.fromDate !== 'undefined' ? req.query.fromDate : moment().subtract( daysRange, "days" ).format( 'YYYY-MM-DD' ),
		toDate = typeof req.query.toDate !== 'undefined' ? req.query.toDate : moment().format( 'YYYY-MM-DD' ),
		ytdFromDate = ( moment().month() >= 7 ? moment().year() : moment().year() - 1 ) + '-07-01';
	
	result.fromDate = fromDate;
	result.toDate = toDate;
	
	let getNumberOfFamilies = modelUtilsService.getNumberOfModelsByDatesAndDateFieldName( 'Family', fromDate, toDate, 'createdAt' ),
		getNumberOfChildren = modelUtilsService.getNumberOfModelsByDatesAndDateFieldName( 'Child', fromDate, toDate, 'createdAt' ),
		getNumberOfInquiries = modelUtilsService.getNumberOfModelsByDatesAndDateFieldName( 'Inquiry', fromDate, toDate, 'takenOn' ),
		getNumberOfPlacements = modelUtilsService.getNumberOfModelsByDatesAndDateFieldName( 'Placement', ytdFromDate, toDate, 'placementDate' ),
		getNumberOfActiveChildren = dashboardService.getNumberOfChildrenByStatusNameAndRegionID( 'active' ),
		getNumberOfOnHoldChildren = dashboardService.getNumberOfChildrenByStatusNameAndRegionID( 'on hold' ),
		getNumberOfAllChildren = dashboardService.getNumberOfChildrenByRegionID( ),
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
