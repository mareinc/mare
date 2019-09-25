// TODO: some of this logic needs to be moved to middleware, calling controllers from there

const keystone 				= require( 'keystone' ),
	  modelUtilsService		= require( '../../utils/model.controllers' ),
	  childService			= require( '../children/child.controllers' ),
	  familyService			= require( '../families/family.controllers' ),
	  socialWorkerService	= require( '../social workers/social-worker.controllers' ),
	  flashMessages	 		= require( '../../utils/notification.middleware' ),
	  agenciesService		= require( '../agencies/agency.controllers' ),
	  ObjectId 				= require( 'mongodb' ).ObjectId,
	  moment				= require( 'moment' ),
	  _						= require( 'underscore' ),
	  dashboardService		= require( './dashboard.controllers' ),
	  childMatchingService	= require( './child-matching.controllers' ),
	  familyMatchingService	= require( './family-matching.controllers' ),
	  utilsService			= require( './utils.controllers' ),
	  listsService			= require( '../lists/list.controllers' );

exports.getChildMatchingData = ( req, res, next ) => {
	const userType	= req.user ? req.user.userType : '',
			childId = req.query.childId;

	let fetchChild = childService.getChildById( { id: childId, fieldsToPopulate: [ 'status', 'siblingsToBePlacedWith' ] } ),
		criteria = childMatchingService.getCriteria( req.query ),
		resultsPromise = childMatchingService.getFamiliesByCriteria( criteria );

	// fetch the social workers and agencies for rendering purposes on the client side
	let fetchSocialWorkers = Array.isArray( req.query.socialWorkers ) ? socialWorkerService.getSocialWorkersByIds( req.query.socialWorkers ) : [],
		fetchAgencies = Array.isArray( req.query.socialWorkersAgency ) ? agenciesService.getAgenciesByIds( req.query.socialWorkersAgency ) : [],
		fetchOtherConsiderations = keystone.list( 'Other Consideration' ).model.find().lean().exec(),
		fetchDisabilities = keystone.list( 'Disability' ).model.find().lean().exec();

	Promise.all( [ fetchChild, fetchSocialWorkers, fetchAgencies, fetchOtherConsiderations, fetchDisabilities, resultsPromise ] )
		.then( values => {
			let result = {};
			
			// assign local variables to the values returned by the promises
			const [ child, socialWorkers, agencies, otherConsiderations, disabilities, results ] = values;
			
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
						params.siblingGroupSizeFrom = child.siblingsToBePlacedWith && child.siblingsToBePlacedWith.length > 0 ? child.siblingsToBePlacedWith.length + 1 : 1;
						
						// determine default needs ranges
						const childHasSiblings = params.siblingGroupSizeFrom > 1;
						// physical needs
						const childPhysicalNeeds = child.physicalNeeds ? child.physicalNeeds : '';
						params.physicalNeedsFrom = childHasSiblings
							? childMatchingService.findMaxLevelOfNeeds( [ childPhysicalNeeds ].concat( child.siblingsToBePlacedWith.map( sibling => sibling.physicalNeeds ? sibling.physicalNeeds : '' ) ) )
							: childPhysicalNeeds;
						// intellectual needs
						const childIntellectualNeeds = child.intellectualNeeds ? child.intellectualNeeds : '';
						params.intellectualNeedsFrom = childHasSiblings
							? childMatchingService.findMaxLevelOfNeeds( [ childIntellectualNeeds ].concat( child.siblingsToBePlacedWith.map( sibling => sibling.intellectualNeeds ? sibling.intellectualNeeds : '' ) ) )
							: childIntellectualNeeds;
						// emotional needs
						const childEmotionalNeeds = child.emotionalNeeds ? child.emotionalNeeds : '';
						params.emotionalNeedsFrom = childHasSiblings
							? childMatchingService.findMaxLevelOfNeeds( [ childEmotionalNeeds ].concat( child.siblingsToBePlacedWith.map( sibling => sibling.emotionalNeeds ? sibling.emotionalNeeds : '' ) ) )
							: childEmotionalNeeds;
				
						result.params = params;
						
						// append the social workers and agencies for rendering purposes on the client side
						result.socialWorkers = utilsService.extractSocialWorkersData( socialWorkers );
						result.socialWorkersAgencies = utilsService.extractAgenicesData( agencies );
						
						// append all other consideration and disability options and mark which options to select based on the child record
						result.otherConsiderations = utilsService.extractOtherConsiderationsData( otherConsiderations, child.otherConsiderations.map( otherConsideration => otherConsideration.toString() ) );
						result.disabilities = utilsService.extractDisabilitiesData( disabilities, child.disabilities.map( disability => disability.toString() ) );
						
						res.send( result );
					})
					.catch( err => {
						console.error( `error loading the default parameters for the child matching report - ${ err }` );

						flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading the default parameters' );
					});
			} else {
				// if criteria were detected send the results
				result.socialWorkers = utilsService.extractSocialWorkersData( socialWorkers );
				result.socialWorkersAgencies = utilsService.extractAgenicesData( agencies );
				result.otherConsiderations = utilsService.extractOtherConsiderationsData( otherConsiderations );
				result.disabilities = utilsService.extractDisabilitiesData( disabilities );
				
				// map array to plain objects including additional data
				result.results = childMatchingService.mapFamiliesToPlainObjects( results );
				
				// sort results
				result.results.sort( childMatchingService.sortFunction );
				
				// send the results in PDF format if 'pdf' parameter was detected in the query string
				if ( req.query.pdf ) {
					utilsService.sendPDF( req, res, result, 'tools-child-matching-pdf', {
						headerTitle: 'Child Match Criteria Listing'
					});
				} else {
					res.send( result );
				}
			}

		})
		.catch( err => {
			console.error( `error loading data for the child matching report - ${ err }` );
			
			flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading the data' );
		});
}

exports.saveFamiliesMatchingHistory = ( req, res, next ) => {
	const childId = req.body.childId;
	
	// verify the number of IDs
	if ( ! Array.isArray( req.body.ids ) || req.body.ids.length === 0 ) {
		flashMessages.sendErrorFlashMessage( res, 'Error', 'There are no entries selected' );
		return;
	}
	
	childService.getChildById( { id: childId } ).then( child => {
		familyService.getFamiliesByIds( req.body.ids ).then( families => {
			let tasks = [],
				allChildrenIDs = [ childId ];
			
			// append all siblings:
			if ( Array.isArray( child.siblingsToBePlacedWith ) ) {
				child.siblingsToBePlacedWith.forEach( sibling => {
					allChildrenIDs.push( sibling.toString() );
				});
			}
			
			// prepare save tasks
			families.forEach( family => {
				allChildrenIDs.forEach( targetChildId => {
					const FamilyMatchingHistory = keystone.list( 'Family Matching History' ),
						familyMatchingHistory = new FamilyMatchingHistory.model({
							child: ObjectId( targetChildId ),
							family: family,
							createdBy: req.user,
							homestudySent: false,
							registrationNumber: family.registrationNumber
						});
					
					tasks.push( familyMatchingHistory.save() );
				});
			});
			
			// wait for all tasks to be done
			Promise.all( tasks )
				.then( results => {
					flashMessages.sendSuccessFlashMessage( res, 'Information', 'All entries have been saved' );
				})
				.catch( err => {
					console.error( `error saving family matching histories - ${ err }` );
					
					flashMessages.sendErrorFlashMessage( res, 'Error', 'Error saving history entries' );
				});
		})
		.catch( err => {
			console.error( `error loading families - ${ err }` );
			
			flashMessages.sendErrorFlashMessage( res, 'Error', 'Error saving history entries' );
		});
	})
	.catch( err => {
		console.error( `error saving family matching histories - could not load the child record- ${ err }` );
		
		flashMessages.sendErrorFlashMessage( res, 'Error', 'Error saving history entries' );
	});
};

exports.getFamilyMatchingData = ( req, res, next ) => {
	const userType	= req.user ? req.user.userType : '',
			familyId = req.query.familyId;

	let fetchFamily = familyService.getFamilyById( familyId, [ 'registeredWithMARE.status' ] ),
		criteria = familyMatchingService.getCriteria( req.query ),
		resultsPromise = familyMatchingService.getChildrenByCriteria( criteria );

	// fetch the social workers and agencies for rendering purposes on the client side
	let fetchAdoptionWorkers = Array.isArray( req.query.adoptionWorkers ) ? 
								socialWorkerService.getSocialWorkersByIds( req.query.adoptionWorkers ) :
								[],
		fetchRecruitmentWorkers = Array.isArray( req.query.recruitmentWorkers ) ?
									socialWorkerService.getSocialWorkersByIds( req.query.recruitmentWorkers ) :
									[],
		fetchAdoptionWorkersAgency = Array.isArray( req.query.adoptionWorkersAgency ) ?
										agenciesService.getAgenciesByIds( req.query.adoptionWorkersAgency ) :
										[],
		fetchRecruitmentWorkersAgency = Array.isArray( req.query.recruitmentWorkersAgency ) ?
										agenciesService.getAgenciesByIds( req.query.recruitmentWorkersAgency ) :
										[];

	Promise.all( [ fetchFamily, fetchAdoptionWorkers, fetchRecruitmentWorkers, fetchAdoptionWorkersAgency, fetchRecruitmentWorkersAgency, resultsPromise ] )
		.then( values => {
			let result = {};
			
			// assign local variables to the values returned by the promises
			const [ family, adoptionWorkers, recruitmentWorkers, adoptionWorkersAgency, recruitmentWorkersAgency, results ] = values;
			
			// output requested family record details
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
						// physical needs
						params.physicalNeedsFrom = 'none';
						params.physicalNeedsTo = preferences.maxNeeds.physical ? preferences.maxNeeds.physical : 'severe';
						// intellectual needs
						params.intellectualNeedsFrom = 'none';
						params.intellectualNeedsTo = preferences.maxNeeds.intellectual ? preferences.maxNeeds.intellectual : 'severe';
						// emotional needs
						params.emotionalNeedsFrom = 'none';
						params.emotionalNeedsTo = preferences.maxNeeds.emotional ? preferences.maxNeeds.emotional : 'severe';

						result.params = params;
						
						// append the social workers and agencies for rendering purposes on the client side
						result.adoptionWorkers = utilsService.extractSocialWorkersData( adoptionWorkers );
						result.adoptionWorkersAgency = utilsService.extractAgenicesData( adoptionWorkersAgency );
						
						res.send( result );
					})
					.catch( err => {
						console.error( `error loading the default parameters for the family matching report - ${ err }` );

						flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading the default parameters' );
					});
			} else {
				// if criteria were detected send the results
				result.adoptionWorkers = utilsService.extractSocialWorkersData( adoptionWorkers );
				result.recruitmentWorkers = utilsService.extractSocialWorkersData( recruitmentWorkers );
				result.adoptionWorkersAgency = utilsService.extractAgenicesData( adoptionWorkersAgency );
				result.recruitmentWorkersAgency = utilsService.extractAgenicesData( recruitmentWorkersAgency );
				
				// append selected fields and their names
				result.fields = familyMatchingService.getFieldsFromQuery( req.query );
				result.fieldNames = familyMatchingService.getFieldNamesFromQuery( req.query );
				
				// map array to plain objects including additional data and requested fields
				result.results = familyMatchingService.mapChildrenToPlainObjects( results, criteria, result.fields );
				
				// sort the results
				result.results.sort( familyMatchingService.sortFunction );
				
				// send the results in PDF format if 'pdf' parameter was detected in the query string
				if ( req.query.pdf ) {
					utilsService.sendPDF( req, res, result, 'tools-family-matching-pdf', {
						headerTitle: 'Family Match Criteria Listing'
					});
				} else {
					res.send( result );
				}
			}

		})
		.catch( err => {
			console.error( `error loading data for the family matching report - ${ err }` );
			
			flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading the data' );
		});
}

exports.saveChildrenMatchingHistory = ( req, res, next ) => {
	const familyId = req.body.familyId;
	
	// verify the number of IDs
	if ( ! Array.isArray( req.body.ids ) || req.body.ids.length === 0 ) {
		flashMessages.sendErrorFlashMessage( res, 'Error', 'There are no entries selected' );
		return;
	}
	
	childService.getChildrenByIds( req.body.ids ).then( children => {
		let tasks = [];
		
		// prepare save tasks
		children.forEach( child => {
			const ChildMatchingHistory = keystone.list( 'Child Matching History' );
			const childMatchingHistory = new ChildMatchingHistory.model({
				family: ObjectId( familyId ),
				child: child,
				createdBy: req.user,
				homestudySent: false,
				registrationNumber: child.registrationNumber
			});
			
			tasks.push( childMatchingHistory.save() );
		});
		
		// wait for all tasks to be done
		Promise.all( tasks )
			.then( results => {
				flashMessages.sendSuccessFlashMessage( res, 'Information', 'All entries have been saved' );
			})
			.catch( err => {
				console.error( `error saving child matching histories - ${ err }` );
				
				flashMessages.sendErrorFlashMessage( res, 'Error', 'Error saving history entries' );
			});
	})
	.catch( err => {
		console.error( `error loading children - ${ err }` );
		
		flashMessages.sendErrorFlashMessage( res, 'Error', 'Error saving history entries' );
	});
	
};

/* return agencies based on keyword query */
exports.getAgenciesData = ( req, res, next ) => {

	const MAX_RESULTS = 10;
	
	utilsService.fetchModelsMapAndSendResults(
		agenciesService.getAgenciesByName( req.query.q, MAX_RESULTS ),
		agency => {
			return {
				id: agency._id.toString(),
				text: agency.name
			}
		},
		res
	);

};

/* return social workers based on keyword query */
exports.getSocialWorkersData = ( req, res, next ) => {

	const MAX_RESULTS = 10;

	utilsService.fetchModelsMapAndSendResults(
		socialWorkerService.getSocialWorkersByName( req.query.q, MAX_RESULTS ),
		socialWorker => {
			return {
				id: socialWorker._id.toString(),
				text: socialWorker.name.full
			}
		},
		res
	);

};

/* return families based on keyword */
exports.getFamiliesData = ( req, res, next ) => {
	
	const MAX_RESULTS = 10;

	utilsService.fetchModelsMapAndSendResults(
		familyService.getFamiliesByName( req.query.q, MAX_RESULTS ),
		family => {
			return {
				id: family._id.toString(),
				text: family.displayNameAndRegistration
			}
		},
		res
	);

};

/* Returns children based on keyword */
exports.getChildrenData = ( req, res, next ) => {
	
	const MAX_RESULTS = 10;

	utilsService.fetchModelsMapAndSendResults(
		childService.getChildrenByName( req.query.q, MAX_RESULTS ),
		child => {
			return {
				id: child._id.toString(),
				text: child.displayNameAndRegistration
			}
		},
		res
	);

};

exports.getSourcesData = ( req, res, next ) => {

	const MAX_RESULTS = 10;

	utilsService.fetchModelsMapAndSendResults(
		listsService.getSourcesByNameFragment( req.query.q, MAX_RESULTS ),
		source => ( { id: source._id.toString(), text: source.source } ),
		res
	);
};

exports.getDashboardData = ( req, res, next ) => {
	const userType	= req.user ? req.user.userType : '',
		  daysRange = 30;
	
	// TOOD: this should be handled through middleware
	// access for admins only
	if ( userType.length === 0 || userType !== 'admin' ) {
		res.statusCode = 403;
		res.setHeader( 'Content-Type', 'text/plain' );
		res.end( 'Access denied' );
		return;
	}
	
	let result = {};
	
	let fromDate = typeof req.query.fromDate !== 'undefined'
		? req.query.fromDate
		: moment().subtract( daysRange, "days" ).format( 'YYYY-MM-DD' );

	let toDate = typeof req.query.toDate !== 'undefined'
		? req.query.toDate
		: moment().format( 'YYYY-MM-DD' );

	let ytdFromDate = moment().month() >= 7
		? `${ moment().year() }-07-01`
		: `${ moment().year() - 1 }-07-01`;

	let ytdToDate = moment().month() >= 7
		? `${ moment().year() + 1 }-06-30`
		: `${ moment().year() }-06-30`;
	
	result.fromDate = fromDate;
	result.toDate = toDate;
	
	let getNumberOfFamilies = modelUtilsService.getNumberOfModelsByDatesAndDateFieldName( 'Family', fromDate, toDate, 'createdAt' ),
		getNumberOfChildren = modelUtilsService.getNumberOfModelsByDatesAndDateFieldName( 'Child', fromDate, toDate, 'createdAt' ),
		getNumberOfInquiries = modelUtilsService.getNumberOfModelsByDatesAndDateFieldName( 'Inquiry', fromDate, toDate, 'takenOn' ),
		getNumberOfPlacements = modelUtilsService.getNumberOfModelsByDatesAndDateFieldName( 'Placement', ytdFromDate, ytdToDate, 'placementDate' ),
		getNumberOfActiveChildren = childService.getNumberOfChildrenByStatusNameAndRegionID( 'active' ),
		getNumberOfOnHoldChildren = childService.getNumberOfChildrenByStatusNameAndRegionID( 'on hold' ),
		getNumberOfAllChildren = childService.getNumberOfChildrenByRegionID(),
		getChildrenNumbersGroupedByRegions = dashboardService.getChildrenNumbersGroupedByRegions();
	
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

			flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading the dashboard data' );
		});
};

exports.getInquiryData = ( req, res, next ) => {
	
	// get the query from the request object
	let query = req.query;
	
	// get the date range of the inquiry search
	let fromDate = new Date( query.fromDate );
	let toDate = new Date( query.toDate );

	// ensure both fromDate and toDate are valid dates
	if ( isNaN( fromDate.getTime() ) || isNaN( toDate.getTime() ) ) {
		return flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading inquiry data' );
	}

	// create the baseline search criteria with a date range
	let searchCriteria = {
		$and: [
			{ takenOn: { $gte: fromDate } },
			{ takenOn: { $lte: toDate } }
		]
	};

	// inquirer criteria (multiple)
	if ( Array.isArray( query.inquirer ) && query.inquirer.length > 0 ) {
		searchCriteria[ 'inquirer' ] = { $in: query.inquirer };
	}

	// inquiry type criteria (multiple)
	if ( Array.isArray( query.inquiryType ) && query.inquiryType.length > 0 ) {
		searchCriteria[ 'inquiryType' ] = { $in: query.inquiryType };
	}

	// inquiry method criteria (multiple)
	if ( Array.isArray( query.inquiryMethod ) && query.inquiryMethod.length > 0 ) {
		let filteredCriteria = query.inquiryMethod.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'inquiryMethod' ] = { $in: filteredCriteria };
	}

	// source criteria (multiple)
	let sourcesCriteria;
	if ( Array.isArray( query.source ) && query.source.length > 0 ) {
		sourcesCriteria = query.source.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'source' ] = { $in: sourcesCriteria };
	}

	// children criteria (multiple)
	let childrenCriteria;
	if ( Array.isArray( query.children ) && query.children.length > 0 ) {
		childrenCriteria = query.children.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'children' ] = { $in: childrenCriteria };
	}

	Promise.all([
		// get the inquiries that match the specified date range and criteria
		keystone.list( 'Inquiry' ).model
			.find( searchCriteria )
			.populate( 'inquiryMethod family source additionalSources' )
			.populate({
				path: 'childsSocialWorker',
				populate: {
					path: 'agency',
					populate: {
						path: 'address.region'
					}
				}
			})
			.populate({
				path: 'children',
				populate: {
					path: 'disabilities'
				}
			})
			.lean()
			.exec(),
		// if thare are sources criteria specified, get the sources docs to seed the select on the search form
		sourcesCriteria
			? keystone.list( 'Source' ).model
				.find( { _id: { $in: sourcesCriteria } } )
				.lean()
				.exec()
				.catch( err => {
					// log an error for debugging purposes
					console.error( `error loading sources for the inquiry report dashboard - ${ err }` );
					// return false to allow the view to render regardless of the error
					return false;
				})
			: false,
		// if thare are children criteria specified, get the sources docs to seed the select on the search form
		childrenCriteria
			? keystone.list( 'Child' ).model
				.find( { _id: { $in: childrenCriteria } } )
				.lean()
				.exec()
				.catch( err => {
					// log an error for debugging purposes
					console.error( `error loading children for the inquiry report dashboard - ${ err }` );
					// return false to allow the view to render regardless of the error
					return false;
				})
			: false
	])
	.then( results => {

		let [ inquiryDocs, sourceDocs, childrenDocs ] = results;
		let responseData = {
			// if there are sources, parse them and add them to the response
			sources: sourceDocs
				? sourceDocs.map( source => ({ 
					id: source._id.toString(), 
					text: source.source 
				}))
				: false,
			children: childrenDocs
				? childrenDocs.map( child => ({ 
					id: child._id.toString(), 
					text: child.displayNameAndRegistration 
				}))
				: false
		};

		// if no results were returned, send the 'noResults' flag
		if ( !inquiryDocs || inquiryDocs.length === 0 ) {
			responseData.noResultsFound = true;
		// if the query returned results, map the relevant fields
		} else {
			responseData.results = inquiryDocs.map( inquiryDoc => {
				// get the child from the inquiry document
				let child = inquiryDoc.children && inquiryDoc.children.length > 0 ? inquiryDoc.children[ 0 ] : undefined;
				// get any additional children (as siblings)
				let siblings = child && inquiryDoc.children.length > 1 ? inquiryDoc.children.slice( 1 ) : undefined;
				// get the family from the inquiry document
				let family = inquiryDoc.family ? inquiryDoc.family : undefined;
				// create a response object
				return {
					childId: child ? child._id.toString() : undefined,
					childRegistrationNumber: child ? child.registrationNumber : undefined,
					childNameFirst: child ? child.name.first : 'Child Not',
					childNameLast: child ? child.name.last : 'Specified',
					siblings: siblings 
						? siblings.map( sibling => ({
							siblingId: sibling._id.toString(),
							siblingRegistrationNumber: sibling.registrationNumber,
							siblingName: `${sibling.name.first} ${sibling.name.last}`
						}))
						: undefined,
					childsSWAgencyRegion: inquiryDoc.childsSocialWorker
						? inquiryDoc.childsSocialWorker.agency
							? inquiryDoc.childsSocialWorker.agency.address.region
								? inquiryDoc.childsSocialWorker.agency.address.region.region
								: undefined
							: undefined
						: undefined,
					maxPhysicalNeeds: childMatchingService.findMaxLevelOfNeeds( inquiryDoc.children.map( child => child.physicalNeeds ? child.physicalNeeds : '' ) ),
					maxIntellectualNeeds: childMatchingService.findMaxLevelOfNeeds( inquiryDoc.children.map( child => child.intellectualNeeds ? child.intellectualNeeds : '' ) ),
					maxEmotionalNeeds: childMatchingService.findMaxLevelOfNeeds( inquiryDoc.children.map( child => child.emotionalNeeds ? child.emotionalNeeds : '' ) ),
					disabilities: inquiryDoc.children && inquiryDoc.children.length > 0
						? inquiryDoc.children.reduce( ( disabilities, child ) => {
								disabilities = disabilities.concat( child.disabilities && child.disabilities.map( disability => disability.disability ) );
								return _.uniq( disabilities );
							}, []).join( ', ' )
						: undefined,
					familyId: family ? family._id.toString() : '',
					familyRegistrationNumber: family ? family.registrationNumber : '',
					familyContact1: family ? family.contact1.name.full : 'Not Specified',
					familyContact2: family && family.contact2.name.full ? family.contact2.name.full : 'Not Specified',
					inquiryType: inquiryDoc.inquiryType,
					inquiryMethod: inquiryDoc.inquiryMethod.inquiryMethod,
					inquiryDate: moment.utc( inquiryDoc.takenOn ).format( 'MM/DD/YYYY' ),
					source: inquiryDoc.source ? inquiryDoc.source.source : 'Not Specified',
					additionalSources: inquiryDoc.additionalSources && inquiryDoc.additionalSources.length > 0
						? inquiryDoc.additionalSources.map( additionalSource => additionalSource.source ).join( ', ' )
						: 'Not Specified',
					intakeSource: inquiryDoc.sourceText ? inquiryDoc.sourceText : 'Not Specified'	
				}
			});
		}
		
		// if 'pdf' parameter was detected in the query, send the response as a PDF
		if ( query.pdf ) {
			utilsService.sendPDF( req, res, responseData, 'tools-inquiry-report-pdf', {
				headerTitle: 'Inquiry Report Listing'
			});
		// otherwise, send the response data as an object to be rendered as a grid on the page
		} else {
			res.send( responseData );
		}
	})
	.catch( err => {
		// log an error for debugging purposes
		console.error( `error loading inquiries for the dashboard - ${ err }` );

		flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading inquiry data' );
	});
};