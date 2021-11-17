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
	
	// check if this is seach is using an anonymous child
	const isAnonymousSearch = childId === 'anonymous';
	// get the child data by ID or use the anonymous child placeholder
	const fetchChild = isAnonymousSearch 
		? Promise.resolve( utilsService.ANONYMOUS_CHILD_RESULT )
		: childService.getChildById( { id: childId, fieldsToPopulate: [ 'status', 'siblingsToBePlacedWith' ] } );
	const criteria = childMatchingService.getCriteria( req.query );
	const resultsPromise = childMatchingService.getFamiliesByCriteria( criteria );

	// fetch the social workers and agencies for rendering purposes on the client side
	let fetchSocialWorkers = Array.isArray( req.query.socialWorkers ) ? socialWorkerService.getSocialWorkersByIds( req.query.socialWorkers ) : [],
		fetchAgencies = Array.isArray( req.query.socialWorkersAgency ) ? agenciesService.getAgenciesByIds( req.query.socialWorkersAgency ) : [],
		fetchOtherConsiderations = keystone.list( 'Other Consideration' ).model.find().lean().exec(),
		fetchDisabilities = keystone.list( 'Disability' ).model.find().lean().exec();
        fetchMatchingExclusions = keystone.list( 'Matching Exclusion' ).model.find().lean().exec();

	Promise.all( [ fetchChild, fetchSocialWorkers, fetchAgencies, fetchOtherConsiderations, fetchDisabilities, fetchMatchingExclusions, resultsPromise ] )
		.then( values => {
			let result = {};
			
			// assign local variables to the values returned by the promises
			const [ child, socialWorkers, agencies, otherConsiderations, disabilities, matchingExclusions, results ] = values;
			
			// output requested child record details
			result.child = childMatchingService.extractChildData( child );
			
			// if no criteria were detected prepare and send the default parameters set based on the child record
			if ( _.isEmpty( criteria ) ) {

				// if the search is using an anonymous child do not set any default params
				if ( isAnonymousSearch ) {
					// create an empty params object
					result.params = {};
					// append other consideration and disability options
					result.otherConsiderations = utilsService.extractOtherConsiderationsData( otherConsiderations, [] );
					result.disabilities = utilsService.extractDisabilitiesData( disabilities, [] );
                    result.familyConstellationExclusions = utilsService.extractMatchingExclusionsData( matchingExclusions.filter( exclusion => exclusion.exclusionType === 'Family Constellation Exclusions' ) );
                	result.otherExclusions = utilsService.extractMatchingExclusionsData( matchingExclusions.filter( exclusion => exclusion.exclusionType === 'Other Exclusions' ) );
					return res.send( result );
				}

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

                        // append matching exclusions
                        result.familyConstellationExclusions = utilsService.extractMatchingExclusionsData(
                            matchingExclusions.filter( exclusion => exclusion.exclusionType === 'Family Constellation Exclusions' ), 
                            child.exclusions.map( exclusion => exclusion.toString() )
                        );
                        result.otherExclusions = utilsService.extractMatchingExclusionsData(
                            matchingExclusions.filter( exclusion => exclusion.exclusionType === 'Other Exclusions' ),
                            child.exclusions.map( exclusion => exclusion.toString() )
                        );
						
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
                result.familyConstellationExclusions = utilsService.extractMatchingExclusionsData( matchingExclusions.filter( exclusion => exclusion.exclusionType === 'Family Constellation Exclusions' ) );
                result.otherExclusions = utilsService.extractMatchingExclusionsData( matchingExclusions.filter( exclusion => exclusion.exclusionType === 'Other Exclusions' ) );
				
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

	// check if this is seach is using an anonymous family
	const isAnonymousSearch = familyId === 'anonymous';
	// get the family data by ID or use the anonymous family placeholder
	const fetchFamily = isAnonymousSearch 
		? Promise.resolve( utilsService.ANONYMOUS_FAMILY_RESULT )
		: familyService.getFamilyById( familyId, [ 'registeredWithMARE.status' ] );
	const criteria = familyMatchingService.getCriteria( req.query );
	const resultsPromise = familyMatchingService.getChildrenByCriteria( criteria );

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

				// if the search is using an anonymous family do not set any default params
				if ( isAnonymousSearch ) {
					result.params = {};
					return res.send( result );
				}

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
		agenciesService.getAgenciesByCode( req.query.q, MAX_RESULTS ),
		agency => {
			return {
				id: agency._id.toString(),
				text: `${agency.code} (${agency.name})`
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
	const includeAnonymousResult = req.query && !!req.query.includeAnon;

	utilsService.fetchModelsMapAndSendResults(
		familyService.getFamiliesByName( req.query.q, MAX_RESULTS, includeAnonymousResult ),
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
	const includeAnonymousResult = req.query && !!req.query.includeAnon;

	utilsService.fetchModelsMapAndSendResults(
		childService.getChildrenByName( req.query.q, MAX_RESULTS, includeAnonymousResult ),
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

	// set a maximum number of results that can be returned to prevent crashes/freezing
	const MAX_RESULTS = 20000;
	
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
		takenOn: { $gte: fromDate, $lte: toDate }
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
			.limit( MAX_RESULTS )
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
					path: 'disabilities legalStatus',
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
					inquiryId: inquiryDoc._id.toString(),
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
					legalStatuses: inquiryDoc.children.map( child => child.legalStatus.legalStatus ),
					familyId: family ? family._id.toString() : '',
					familyRegistrationNumber: family ? family.registrationNumber : '',
					familyContact1: family ? family.contact1.name.full : 'Not Specified',
					familyContact2: family && family.contact2.name.full ? family.contact2.name.full : 'Not Specified',
					inquiryType: inquiryDoc.inquiryType,
					inquiryMethod: inquiryDoc.inquiryMethod.inquiryMethod,
					inquiryDate: moment.utc( inquiryDoc.takenOn ).format( 'MM/DD/YYYY' ),
					inquiryDateISO: moment( inquiryDoc.takenOn ).toISOString(),
					source: inquiryDoc.source ? inquiryDoc.source.source : 'Not Specified',
					additionalSources: inquiryDoc.additionalSources && inquiryDoc.additionalSources.length > 0
						? inquiryDoc.additionalSources.map( additionalSource => additionalSource.source ).join( ', ' )
						: 'Not Specified',
					sourceDescription: inquiryDoc.sourceDescription ? inquiryDoc.sourceDescription : 'Not Specified'
				}
			});

			// check if inquiry limit result has been reached
			responseData.limitReached = inquiryDocs.length === MAX_RESULTS;
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

exports.getPlacementData = ( req, res, next ) => {

	// get the query from the request object
	let query = req.query;
	
	// get the date range of the inquiry search
	let fromDate = new Date( query.fromDate );
	let toDate = new Date( query.toDate );

	// ensure both fromDate and toDate are valid dates
	if ( isNaN( fromDate.getTime() ) || isNaN( toDate.getTime() ) ) {
		return flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading inquiry data' );
	}

	// create the search criteria
	let searchCriteria = {};

	// source criteria (multiple)
	let sourcesCriteria;
	if ( Array.isArray( query.source ) && query.source.length > 0 ) {
		sourcesCriteria = query.source.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'source' ] = { $in: sourcesCriteria };
	}

	// source criteria (multiple)
	let additionalSourcesCriteria;
	if ( Array.isArray( query.additionalSource ) && query.additionalSource.length > 0 ) {
		additionalSourcesCriteria = query.additionalSource.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'additionalSources' ] = { $in: additionalSourcesCriteria };
	}

	// placement type criteria (multiple)
	// get the subset of placement types specified in the query, otherwise default to all placement types
	let placementTypeCriteria = query.placementType || utilsService.PLACEMENT_TYPES.map( placementType => placementType.modelName );

	// create queries for each of the different placement types 
	let placementQueries = utilsService.PLACEMENT_TYPES.map( placementType => {

		// check to ensure the placement type is in the search criteria
		if ( !placementTypeCriteria.find( placementTypeCriterion => placementTypeCriterion === placementType.modelName ) ) {
			// if not, return an empty array to ensure result concatenation can still occur successfully
			return [];
		}

		// add the date range criteria to the search criteria
		let _searchCriteria = {
			[ placementType.datePath ]: { $gte: fromDate, $lte: toDate },
			...searchCriteria
		};

		// create a query with the search criteria
		return keystone.list( placementType.modelName ).model
			.find( _searchCriteria )
			.populate( 'source additionalSources familyDetails.agency familyDetails.race familyDetails.familyConstellation familyDetails.address.region familyAgency' )
			.populate({
				path: 'child',
				populate: {
					path: [
						'gender',
						'race',
						'status',
						'legalStatus',
						'adoptionWorker',
						'adoptionWorkerAgency',
						'adoptionWorkerAgencyRegion',
						'siblingsToBePlacedWith',
						'residence'
					].join( ' ' )
				}
			})
			.populate({
				path: 'family',
				populate: {
					path: [
						'socialWorkerAgency',
						'familyConstellation',
						'address.region',
						'address.state',
						'contact1.race',
						'contact2.race'
					].join( ' ' )
				}
			})
			.lean()
			.exec();
	});

	Promise.all([
		// if thare are sources criteria specified, get the sources docs to seed the select on the search form
		sourcesCriteria
			? keystone.list( 'Source' ).model
				.find( { _id: { $in: sourcesCriteria } } )
				.lean()
				.exec()
				.catch( err => {
					// log an error for debugging purposes
					console.error( `error loading sources for the placement report dashboard - ${ err }` );
					// return false to allow the view to render regardless of the error
					return false;
				})
			: false,
		// if thare are additional sources criteria specified, get the sources docs to seed the select on the search form
		additionalSourcesCriteria
			? keystone.list( 'Source' ).model
				.find( { _id: { $in: additionalSourcesCriteria } } )
				.lean()
				.exec()
				.catch( err => {
					// log an error for debugging purposes
					console.error( `error loading additional sources for the placement report dashboard - ${ err }` );
					// return false to allow the view to render regardless of the error
					return false;
				})
			: false,
		// append the placement queries
		...placementQueries
		])
		.then(results => {

			// destructure results
			// placement type order return order: 'Placement', 'Match', 'Legalization', 'Disruption', 'Weekend Family Connection'
			let [ sourceDocs, additionalSourceDocs, placementDocs, matchDocs, legalizationDocs, disruptionDocs, weekendFamilyConnectionDocs ] = results;

			let responseData = {
				// if there are sources, parse them and add them to the response
				sources: sourceDocs
					? sourceDocs.map( source => ({ 
						id: source._id.toString(), 
						text: source.source 
					}))
					: false,
				// if there are additional sources, parse them and add them to the response
				additionalSources: additionalSourceDocs
					? additionalSourceDocs.map( source => ({ 
						id: source._id.toString(), 
						text: source.source 
					}))
					: false
			};

			// helper function to map placement data and include type
			function mapPlacementDataWithPlacementType( placementType, placementData ) {
				// get the date field for each placement type model
				const typeSpecificDateField = placementType.datePath;
				// map placement data to results object
				return placementData.map( placement => ({
					placementId: placement._id.toString(),
					placementDatabasePath: placementType.adminUIPath,
					placementType: placementType.modelName,
					placementDate: moment.utc( placement[typeSpecificDateField] ).format( 'MM/DD/YYYY' ),
					placementDateISO: moment( placement[typeSpecificDateField] ).toISOString(),
					daysBeforePlacement: placement.child 
						? moment.utc( placement[typeSpecificDateField] ).diff( moment.utc( placement.child.registrationDate ), 'days' )
						: undefined,
					ageAtPlacement: placement.child
						? moment.utc( placement[typeSpecificDateField] ).diff( moment.utc( placement.child.birthDate ), 'years', true ).toFixed( 1 )
						: undefined,
					source: placement.source ? placement.source.source : undefined,
					additionalSources: placement.additionalSources && placement.additionalSources.length > 0
						? placement.additionalSources.map( additionalSource => additionalSource.source ).join( ', ' )
						: undefined,
					notes: placement.notes,
					childId: placement.child ? placement.child._id.toString() : undefined,
					childRegistrationNumber: placement.child ? placement.child.registrationNumber : undefined,
					childNameFirst: placement.isUnregisteredChild && placement.childDetails.firstName
						? placement.childDetails.firstName !== ''
							? placement.childDetails.firstName
							: ''
						: placement.child
							? placement.child.name.first
							: '',
					childNameLast: placement.isUnregisteredChild && placement.childDetails.lastName
						? placement.childDetails.lastName !== ''
							? placement.childDetails.lastName
							: ''
						: placement.child
							? placement.child.name.last
							: '',
					childRace: placement.child && placement.child.race && placement.child.race.length > 0
						? placement.child.race.map( race => race.race ).join( ', ' )
						: undefined,
					childGender: placement.child ? placement.child.gender.gender : undefined,
					childStatus: placement.child ? placement.child.status.childStatus : undefined,
					childLegalStatus: placement.child ? placement.child.legalStatus.legalStatus : undefined,
					childRegistrationDate: placement.child 
						? moment.utc( placement.child.registrationDate ).format( 'MM/DD/YYYY' )
						: undefined,
					childCurrentResidence: placement.child && placement.child.residence
						? placement.child.residence.residence
						: undefined,
					childSW: placement.child && placement.child.adoptionWorker
						? placement.child.adoptionWorker.name.full
						: undefined,
					childSWAgency: placement.child && placement.child.adoptionWorkerAgency
						? placement.child.adoptionWorkerAgency.name
						: undefined,
					childSWAgencyRegion: placement.child && placement.child.adoptionWorkerAgencyRegion
						? placement.child.adoptionWorkerAgencyRegion.region
						: undefined,
					childPhysicalNeeds: placement.child ? placement.child.physicalNeeds : undefined,
					childEmotionalNeeds: placement.child ? placement.child.emotionalNeeds : undefined,
					childIntellectualNeeds: placement.child ? placement.child.intellectualNeeds : undefined,
					childSocialNeeds: placement.child ? placement.child.socialNeeds : undefined,
					siblings: placement.child 
						&& placement.child.siblingsToBePlacedWith
						&& placement.child.siblingsToBePlacedWith.length > 0
							? placement.child.siblingsToBePlacedWith.map( sibling => `${sibling.name.first} ${sibling.name.last}` )
							: undefined,
					familyId: placement.family ? placement.family._id.toString() : undefined,
					familyRegistrationNumber: placement.family ? placement.family.registrationNumber : undefined,
					familyContact1: placement.family
						? placement.family.contact1.name.full
							? placement.family.contact1.name.full
							: 'Not Specified'
						: placement.familyDetails.name
							? placement.familyDetails.name && placement.familyDetails.name !== ''
							: 'Not Specified',
					familyContact1Race: placement.family
						? placement.family.contact1.race && placement.family.contact1.race.length > 0
							? placement.family.contact1.race.map( race => race.race ).join( ', ' )
							: undefined
						: placement.familyDetails.race && placement.familyDetails.race.length > 0
							? placement.familyDetails.race.map( race => race.race ).join( ', ' )
							: undefined,
					familyContact2Race: placement.family
						? placement.family.contact2.race && placement.family.contact2.race.length > 0
							? placement.family.contact2.race.map( race => race.race ).join( ', ' )
							: undefined
						: undefined,
					familyContact2: placement.family && placement.family.contact2.name.full
						? placement.family.contact2.name.full
						: 'Not Specified',
					familySWAgency: placement.familyDetails && placement.familyDetails.agency
						? placement.familyDetails.agency.name
						: placement.familyAgency
							? placement.familyAgency.name
							: undefined,
					familyRegion: placement.family
						? placement.family.address.region
							? placement.family.address.region.region
							: undefined
						: placement.familyDetails.address && placement.familyDetails.address.region
							? placement.familyDetails.address.region.region
							: undefined,
					familyState: placement.family
						? placement.family.address.state
							? placement.family.address.state.state
							: undefined
						: placement.familyDetails.address && placement.familyDetails.address.state
							? placement.familyDetails.address.state.state
							: undefined,
					familyConstellation: placement.family
						? placement.family.familyConstellation
							? placement.family.familyConstellation.familyConstellation
							: undefined
						: placement.familyDetails.familyConstellation
							? placement.familyDetails.familyConstellation.familyConstellation
							: undefined,
					familyRegisteredWithMARE: placement.family 
						? placement.family.registeredWithMARE.registered
							? 'Y'
							: 'N'
						: 'N'
				}));
			}

			// merge results of different placement types into a single list
			let mergedResults = mapPlacementDataWithPlacementType( utilsService.PLACEMENT_TYPES.find( placementType => placementType.modelName === 'Placement' ), placementDocs ).concat(
				mapPlacementDataWithPlacementType( utilsService.PLACEMENT_TYPES.find( placementType => placementType.modelName === 'Match' ), matchDocs ),
				mapPlacementDataWithPlacementType( utilsService.PLACEMENT_TYPES.find( placementType => placementType.modelName === 'Legalization' ), legalizationDocs ),
				mapPlacementDataWithPlacementType( utilsService.PLACEMENT_TYPES.find( placementType => placementType.modelName === 'Disruption' ), disruptionDocs ),
				mapPlacementDataWithPlacementType( utilsService.PLACEMENT_TYPES.find( placementType => placementType.modelName === 'Weekend Family Connection' ), weekendFamilyConnectionDocs )
			);

			// if no results were returned, send the 'noResults' flag
			if ( !mergedResults || mergedResults.length === 0 ) {
				responseData.noResultsFound = true;
			// if the query returned results, map the relevant fields
			}  else {
				responseData.results = mergedResults;
			}

			// if 'pdf' parameter was detected in the query, send the response as a PDF
			if ( query.pdf ) {
				utilsService.sendPDF( req, res, responseData, 'tools-placement-report-pdf', {
					headerTitle: 'Placement Report Listing'
				});
			// otherwise, send the response data as an object to be rendered as a grid on the page
			} else {
				res.send( responseData );
			}
		})
		.catch(err => {
			// log an error for debugging purposes
			console.error( `error loading placements for the dashboard - ${ err }` );

			flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading placement data' );
		});
};

exports.getMediaFeaturesData = ( req, res, next ) => {

	// set a maximum number of results that can be returned to prevent crashes/freezing
	const MAX_RESULTS = 1000;

	// get the query from the request object
	let query = req.query;

	// create the search criteria object
	let searchCriteria = {};
	
	// get the date range of the media feature search
	let fromDate = new Date( query.fromDate );
	let toDate = new Date( query.toDate );

	// ensure both fromDate and toDate are valid dates
	if ( isNaN( fromDate.getTime() ) || isNaN( toDate.getTime() ) ) {
		return flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading inquiry data' );
	}

	// set the search criteria date range
	searchCriteria.date = { $gte: fromDate, $lte: toDate };

	// children criteria (multiple)
	let childrenCriteria;
	if ( Array.isArray( query.children ) && query.children.length > 0 ) {
		childrenCriteria = query.children.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'children' ] = { $in: childrenCriteria };
	}

	// source criteria (multiple)
	let sourcesCriteria;
	if ( Array.isArray( query.source ) && query.source.length > 0 ) {
		sourcesCriteria = query.source.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'source' ] = { $in: sourcesCriteria };
	}

	// add any filter criteria that are specified in the media feature search params
	let filterCriteria = [];

	// professional photo criteria
	if ( query.professionalPhoto ) {
		filterCriteria.push( 'hasPhotolistingPhoto' );
	}

	// video snapshot criteria
	if ( query.videoSnapshot ) {
		filterCriteria.push( 'hasVideoSnapshot' );
	}

	let responseData = {};

	Promise.all([
		// get the media features that match the specified date range and criteria
		keystone.list( 'Media Feature' ).model
			.find( searchCriteria )
			.limit( MAX_RESULTS )
			.populate( 'source' )
			.populate({
				path: 'children',
				populate: {
					path: 'status'
				}
			})
			.lean()
			.exec(),
		// if thare are children criteria specified, get the sources docs to seed the select on the search form
		childrenCriteria
			? keystone.list( 'Child' ).model
				.find( { _id: { $in: childrenCriteria } } )
				.lean()
				.exec()
				.catch( err => {
					// log an error for debugging purposes
					console.error( `error loading children for the media feature report dashboard - ${ err }` );
					// return false to allow the view to render regardless of the error
					return false;
				})
			: false,
		// if thare are sources criteria specified, get the sources docs to seed the select on the search form
		sourcesCriteria
			? keystone.list( 'Source' ).model
				.find( { _id: { $in: sourcesCriteria } } )
				.lean()
				.exec()
				.catch( err => {
					// log an error for debugging purposes
					console.error( `error loading sources for the placement report dashboard - ${ err }` );
					// return false to allow the view to render regardless of the error
					return false;
				})
			: false
	])
	.then( results => {

		let [ mediaFeatureDocs, childrenDocs, sourceDocs ] = results;

		responseData = {
			// if there are children, parse them and add them to the response
			children: childrenDocs
				? childrenDocs.map( child => ({ 
					id: child._id.toString(), 
					text: child.displayNameAndRegistration 
				}))
				: false,
			// if there are sources, parse them and add them to the response
			sources: sourceDocs
				? sourceDocs.map( source => ({ 
					id: source._id.toString(), 
					text: source.source 
				}))
				: false
		};

		// if no results were returned, set the 'noResults' flag and skip results mapping
		if ( !mediaFeatureDocs || mediaFeatureDocs.length === 0 ) {
			responseData.noResultsFound = true;
			return;
		// if the query returned results, map the relevant fields
		} else {

			let childPassesFilterCriteria = childDoc => {
				let passesFilterCriteria = filterCriteria.length === 0 || filterCriteria.every( criterion => childDoc[ criterion ] );
				let passesChildCriteria = !childrenCriteria || childrenCriteria.find( child => child === childDoc._id.toString() );
				return passesFilterCriteria && passesChildCriteria;
			};

			// create a result set from the matching media features
			responseData.results = mediaFeatureDocs.reduce( ( results, mediaFeatureDoc ) => {

				// create a result for each child associated with the media feature
				mediaFeatureDoc.children.forEach( childDoc => {

					// ensure child passes any filter criteria specified
					if ( childPassesFilterCriteria( childDoc ) ) {
						results.push({
							childId: childDoc._id.toString(),
							childRegistrationNumber: childDoc.registrationNumber,
							childNameFirst: childDoc.name.first,
							childNameLast: childDoc.name.last,
							childStatus: childDoc.status.childStatus,
							childHasProfessionalPhoto: childDoc.hasPhotolistingPhoto ? 'Yes' : 'No',
							childHasVideoSnapshot: childDoc.hasVideoSnapshot ? 'Yes' : 'No',
							childRegistrationDate: moment.utc( childDoc.registrationDate ),
							childPlacementDate: moment.utc( childDoc.statusChangeDate ).format( 'MM/DD/YYYY' ),
							mediaFeatureSource: mediaFeatureDoc.source.source,
							mediaFeatureDate: {
								raw: moment.utc( mediaFeatureDoc.date ),
								formattedString: moment.utc( mediaFeatureDoc.date ).format( 'MM/DD/YYYY' ),
								formattedISO: moment( mediaFeatureDoc.date ).toISOString()
							}
						});
					}
				});
				
				return results;
			}, []);

			// check if media feature limit result has been reached
			responseData.limitReached = mediaFeatureDocs.length === MAX_RESULTS;

			// get inquiry data for each result (child)
			return keystone.list( 'Inquiry' ).model
				.find( { children: { $in: responseData.results.map( result => result.childId ) } } )
				.lean()
				.exec();
		}
	})
	.then( inquiryDocs => {

		// if media feature results were found...
		if ( !responseData.noResultsFound ) {
			
			// add inquiry data to each result
			responseData.results.forEach( result => {

				// get the number of months since the child associated with the result has registered (where month is any 30-day period)
				let monthsSinceRegistrationDate = result.mediaFeatureDate.raw.diff( result.childRegistrationDate, 'days' ) / 30;
				// get the number of months after the media feature date (where month is any 30-day period)
				let monthsAfterRegistrationDate = moment.utc().diff( result.mediaFeatureDate.raw, 'days' ) / 30;
				// get the month following the media feature date
				let monthFollowingMediaFeature = result.mediaFeatureDate.raw.clone().add( 30, 'days' ); // clone to prevent mutation of original date
				let sixMonthsFollowingMediaFeature = result.mediaFeatureDate.raw.clone().add( 180, 'days' ); // clone to prevent mutation of original date
				let inquiryCounts = {
					beforeFeature: 0,
					next30Days: 0,
					afterFeature: 0
				};

				for ( const inquiryDoc of inquiryDocs ) {

					// if the child is part of the inquiry...
					if ( !!inquiryDoc.children.find( childId => childId.toString() === result.childId ) ) {

						let inquiryDate = moment.utc( inquiryDoc.takenOn );
						
						// if the inquiry was received before the media feature...
						if ( inquiryDate.isBetween( result.childRegistrationDate, result.mediaFeatureDate.raw, '[)' ) ) {
							inquiryCounts.beforeFeature++;
						
						// if the inquiry was received after the media feature
						} else {

							// check if the inquiry was received in the first month after the media feature...
							if ( inquiryDate.isBetween( result.mediaFeatureDate.raw, monthFollowingMediaFeature, '[]' ) ) {
								inquiryCounts.next30Days++;
							}

							// check if the inquiry was received in the 6 months after the media feature...
							if ( inquiryDate.isBetween( result.mediaFeatureDate.raw, sixMonthsFollowingMediaFeature, '[]' ) ) {
								inquiryCounts.afterFeature++;
							}
						}
					}
				}

				// add inquiry statistics to the result object
				result.avgInquiriesBeforeFeature = ( inquiryCounts.beforeFeature / monthsSinceRegistrationDate ).toFixed( 2 );
				result.inquiriesMonthAfterFeature = inquiryCounts.next30Days;
				result.avgInquiriesSixMonthsAfterFeature = ( inquiryCounts.afterFeature / Math.min( monthsAfterRegistrationDate, 6 ) ).toFixed( 2 );
			});
		}

		// if 'pdf' parameter was detected in the query, send the response as a PDF
		if ( query.pdf ) {
			utilsService.sendPDF( req, res, responseData, 'tools-media-features-pdf', {
				headerTitle: 'Media Features Report Listing'
			});
		// otherwise, send the response data as an object to be rendered as a grid on the page
		} else {
			res.send( responseData );
		}
	})
	.catch( err => {

		// log an error for debugging purposes
		console.error( `error loading media features for the dashboard - ${ err }` );

		flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading media feature data' );
	});
};

exports.getChildListingData = ( req, res, next ) => {

	// set a maximum number of results that can be returned to prevent crashes/freezing
	const MAX_RESULTS = 5000;
	
	// get the query from the request object
	let query = req.query;

	// create the search criteria
	let searchCriteria = {};

	// registration date range criteria (required)
	let registrationDateFrom = new Date( query.regDateFrom );
	let registrationDateTo = new Date( query.regDateTo );
	searchCriteria.registrationDate = { $gte: registrationDateFrom, $lte: registrationDateTo };

	// current age date range
	if ( query.currentAgeFrom || query.currentAgeTo ) {
		// if both upper and lower limit is set
		if ( query.currentAgeFrom && query.currentAgeTo ) {
			// determine the minimum and maximum birth dates that would match the age criteria specified
			let minBirthDate = moment.utc().startOf( 'day' ).subtract( Number( query.currentAgeTo ) + 1, 'years' ); // add 1 to max age to capture children who are part way through their nth year
			let maxBirthDate = moment.utc().startOf( 'day' ).subtract( query.currentAgeFrom, 'years' );
			// create range criteria
			searchCriteria.birthDate = { $gte: minBirthDate, $lte: maxBirthDate };

		// if only the lower limit is set
		} else if ( query.currentAgeFrom ) {
			// determine the birth date that would match the age criteria
			let targetBirthDate = moment.utc().startOf( 'day' ).subtract( query.currentAgeFrom, 'years' );
			// create lte criteria ( dates that are less are further in the past, so the child would be older than the target date )
			searchCriteria.birthDate = { $lte: targetBirthDate };

		// if only upper limit is set
		} else {
			// determine the birth date that would match the age criteria
			let targetBirthDate = moment.utc().startOf( 'day' ).subtract(  Number( query.currentAgeTo ) + 1, 'years' ); // add 1 to max age to capture children who are part way through their nth year
			// create gte criteria ( dates that are greater are more recent, so the child would be younger than the target date )
			searchCriteria.birthDate = { $gte: targetBirthDate };
		}
	}

	// maintain a combined recruitment and adoption worker criteria list so they can be retrieved using the same social worker query
	let combinedSocialWorkerCriteria = [];

	// adoption worker criteria (multiple)
	let adoptionWorkerCriteria;
	if ( Array.isArray( query[ 'adoption-worker' ] ) && query[ 'adoption-worker' ].length > 0 ) {
		adoptionWorkerCriteria = query[ 'adoption-worker' ].filter( ( objectId ) => ObjectId.isValid( objectId ) );
		combinedSocialWorkerCriteria = combinedSocialWorkerCriteria.concat( adoptionWorkerCriteria );
		searchCriteria[ 'adoptionWorker' ] = { $in: adoptionWorkerCriteria };
	}

	// recruitment worker criteria (multiple)
	let recruitmentWorkerCriteria;
	if ( Array.isArray( query[ 'recruitment-worker' ] ) && query[ 'recruitment-worker' ].length > 0 ) {
		recruitmentWorkerCriteria = query[ 'recruitment-worker' ].filter( ( objectId ) => ObjectId.isValid( objectId ) );
		combinedSocialWorkerCriteria = combinedSocialWorkerCriteria.concat( recruitmentWorkerCriteria );
		searchCriteria[ 'recruitmentWorker' ] = { $in: recruitmentWorkerCriteria };
	}

	// maintain a combined recruitment and adoption worker agency criteria list so they can be retrieved using the same social worker query
	let combinedSocialWorkerAgencyCriteria = [];

	// adoption worker agency criteria (multiple)
	let adoptionWorkerAgencyCriteria;
	if ( Array.isArray( query[ 'adoption-worker-agency' ] ) && query[ 'adoption-worker-agency' ].length > 0 ) {
		adoptionWorkerAgencyCriteria = query[ 'adoption-worker-agency' ].filter( ( objectId ) => ObjectId.isValid( objectId ) );
		combinedSocialWorkerAgencyCriteria = combinedSocialWorkerAgencyCriteria.concat( adoptionWorkerAgencyCriteria );
		searchCriteria[ 'adoptionWorkerAgency' ] = { $in: adoptionWorkerAgencyCriteria };
	}

	// adoption worker agency criteria (multiple)
	let recruitmentWorkerAgencyCriteria;
	if ( Array.isArray( query[ 'recruitment-worker-agency' ] ) && query[ 'recruitment-worker-agency' ].length > 0 ) {
		recruitmentWorkerAgencyCriteria = query[ 'recruitment-worker-agency' ].filter( ( objectId ) => ObjectId.isValid( objectId ) );
		combinedSocialWorkerAgencyCriteria = combinedSocialWorkerAgencyCriteria.concat( recruitmentWorkerAgencyCriteria );
		searchCriteria[ 'recruitmentWorkerAgency' ] = { $in: recruitmentWorkerAgencyCriteria };
	}

	// adoption worker agency region criteria (multiple)
	let adoptionWorkerAgencyRegionCriteria;
	if ( Array.isArray( query[ 'adoption-worker-region' ] ) && query[ 'adoption-worker-region' ].length > 0 ) {
		adoptionWorkerAgencyRegionCriteria = query[ 'adoption-worker-region' ].filter( ( objectId ) => ObjectId.isValid( objectId ) );
		combinedSocialWorkerAgencyCriteria = combinedSocialWorkerAgencyCriteria.concat( adoptionWorkerAgencyRegionCriteria );
		searchCriteria[ 'adoptionWorkerAgencyRegion' ] = { $in: adoptionWorkerAgencyRegionCriteria };
	}

	let recruitmentWorkerAgencyRegionCriteria;
	if ( Array.isArray( query[ 'recruitment-worker-region' ] ) && query[ 'recruitment-worker-region' ].length > 0 ) {
		recruitmentWorkerAgencyRegionCriteria = query[ 'recruitment-worker-region' ].filter( ( objectId ) => ObjectId.isValid( objectId ) );
		combinedSocialWorkerAgencyCriteria = combinedSocialWorkerAgencyCriteria.concat( recruitmentWorkerAgencyRegionCriteria );
		searchCriteria[ 'recruitmentWorkerAgencyRegion' ] = { $in: recruitmentWorkerAgencyRegionCriteria };
	}

	// race criteria (multiple)
	let raceCriteria;
	if ( Array.isArray( query.race ) && query.race.length > 0 ) {
		raceCriteria = query.race.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'race' ] = { $in: raceCriteria };
	}

	// gender criteria (multiple)
	let genderCriteria;
	if ( Array.isArray( query.gender ) && query.gender.length > 0 ) {
		genderCriteria = query.gender.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'gender' ] = { $in: genderCriteria };
	}

	// legal status criteria (multiple)
	let legalStatusCriteria;
	if ( Array.isArray( query[ 'legal-status' ] ) && query[ 'legal-status' ].length > 0 ) {
		legalStatusCriteria = query[ 'legal-status' ].filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'legalStatus' ] = { $in: legalStatusCriteria };
	}

	// placement status criteria (multiple)
	let placementStatusCriteria;
	if ( Array.isArray( query[ 'placement-status' ] ) && query[ 'placement-status' ].length > 0 ) {
		placementStatusCriteria = query[ 'placement-status' ].filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'status' ] = { $in: placementStatusCriteria };
	}

	// residence criteria (multiple)
	let residenceCriteria;
	if ( Array.isArray( query.residence ) && query.residence.length > 0 ) {
		residenceCriteria = query.residence.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		searchCriteria[ 'residence' ] = { $in: residenceCriteria };
	}

	// physical needs criteria (multiple)
	if ( Array.isArray( query[ 'physical-needs' ] ) && query[ 'physical-needs' ].length > 0 ) {
		searchCriteria[ 'physicalNeeds' ] = { $in: query[ 'physical-needs' ] };
	}

	// emotional needs criteria (multiple)
	if ( Array.isArray( query[ 'emotional-needs' ] ) && query[ 'emotional-needs' ].length > 0 ) {
		searchCriteria[ 'emotionalNeeds' ] = { $in: query[ 'emotional-needs' ] };
	}

	// intellectual needs criteria (multiple)
	if ( Array.isArray( query[ 'intellectual-needs' ] ) && query[ 'intellectual-needs' ].length > 0 ) {
		searchCriteria[ 'intellectualNeeds' ] = { $in: query[ 'intellectual-needs' ] };
	}

	// must be placed with siblings criteria
	if ( !!query.placedWithSiblings ) {
		searchCriteria.mustBePlacedWithSiblings = true;
	}

	// professional photo criteria
	if ( !!query.professionalPhoto ) {
		searchCriteria.hasPhotolistingPhoto = true;
	}

	// video snapshot criteria
	if ( !!query.videoSnapshot ) {
		searchCriteria.hasVideoSnapshot = true;
	}

	// Adoptuskids website criteria
	if ( !!query.adoptUsKids ) {
		searchCriteria.onAdoptuskids = true;
	}

	// wednesday's child criteria
	if ( !!query.wednesdaysChild ) {
		searchCriteria.wednesdaysChild = true;
	}

	// wendy's kids caseload east criteria
	if ( !!query.wendysKidsEast ) {
		searchCriteria[ '$or' ] = searchCriteria[ '$or' ] || [];
		searchCriteria[ '$or' ].push(
			{ wendysWonderfulKidsCaseloadEast: true },
			{ wendysWonderfulKidsCaseloadEastSiblingGroup: true }
		);
	}

	// wendy's kids caseload west criteria
	if ( !!query.wendysKidsWest ) {
		searchCriteria[ '$or' ] = searchCriteria[ '$or' ] || [];
		searchCriteria[ '$or' ].push(
			{ wendysWonderfulKidsCaseloadWest: true },
			{ wendysWonderfulKidsCaseloadWestSiblingGroup: true }
		);
	}
	
	// coalition meeting criteria
	if ( !!query.coalitionMeeting ) {
		searchCriteria.coalitionMeeting = true;
	}

	// matching event criteria
	if ( !!query.matchingEvent ) {
		searchCriteria.matchingEvent = true;
	}

	// display image criteria
	if ( !!query.displayImage ) {
		searchCriteria[ 'image.url' ] = { $exists: true, $ne: null };
	}

	// weekend family connections
	if ( !!query.weekendFamilyConnections ) {
		searchCriteria[ 'weekendFamilyConnections' ] = true;
	}

	// specialized recruitment coordination
	if ( !!query.specializedRecruitmentCoordination ) {
		searchCriteria[ 'specializedRecruitment' ] = true;
	}

    // identifies as LGBTQ+ criteria
	if ( !!query.identifiesAsLGBTQ ) {
		searchCriteria[ 'identifiesAsLGBTQ' ] = query.identifiesAsLGBTQ;
	}

	Promise.all([
		// get the children that match the specified date range and criteria
		keystone.list( 'Child' ).model
			.find( searchCriteria )
			.limit( MAX_RESULTS )
			.populate( 'gender race status legalStatus residence adoptionWorker adoptionWorkerAgencyRegion siblingsToBePlacedWith' )
			.lean()
			.exec(),
		// if thare are any social worker criteria specified, get the social worker docs to seed the social worker selects on the search form
		combinedSocialWorkerCriteria.length > 0
			? keystone.list( 'Social Worker' ).model
				.find( { _id: { $in: combinedSocialWorkerCriteria } } )
				.lean()
				.exec()
				.catch( err => {
					// log an error for debugging purposes
					console.error( `error loading social workers for the child listing report dashboard - ${ err }` );
					// return false to allow the view to render regardless of the error
					return false;
				})
			: false,
		// if thare are adoption agency criteria specified, get the adoption agency docs to seed the select on the search form
		combinedSocialWorkerAgencyCriteria.length > 0
			? keystone.list( 'Agency' ).model
				.find( { _id: { $in: combinedSocialWorkerAgencyCriteria } } )
				.lean()
				.exec()
				.catch( err => {
					// log an error for debugging purposes
					console.error( `error loading agencies for the child listing report dashboard - ${ err }` );
					// return false to allow the view to render regardless of the error
					return false;
				})
			: false
	])
	.then( results => {

		// destructure results
		let [ childDocs, socialWorkerDocs, socialWorkerAgencyDocs ] = results;

		let childListings = childDocs.map( childDoc => ({
			id: childDoc._id.toString(),
			firstName: childDoc.name.first,
			lastName: childDoc.name.last,
			registrationNumber: childDoc.registrationNumber,
			gender: childDoc.gender.gender,
			race: childDoc.race && childDoc.race.length > 0
				? childDoc.race.map( race => race.race ).join( ', ' )
				: '--',
			placementStatus: childDoc.status.childStatus,
			legalStatus: childDoc.legalStatus.legalStatus,
			residence: childDoc.residence ? childDoc.residence.residence : '--',
			physicalNeeds: childDoc.physicalNeeds || '--',
			emotionalNeeds: childDoc.emotionalNeeds || '--',
			intellectualNeeds: childDoc.intellectualNeeds || '--',
			adoptionWorker: childDoc.adoptionWorker ? childDoc.adoptionWorker.name.full : 'N/A',
			adoptionWorkerRegion: childDoc.adoptionWorkerAgencyRegion ? childDoc.adoptionWorkerAgencyRegion.region : 'N/A',
			currentAge: moment.utc().startOf( 'day' ).diff( moment.utc( childDoc.birthDate ), 'years' ),
			daysSinceRegistration: moment.utc().startOf( 'day' ).diff( moment.utc( childDoc.registrationDate ), 'days' ),
			ageAtRegistration: ( moment.utc().startOf( 'day' ).diff( moment.utc( childDoc.birthDate ), 'years', true ) - moment.utc().startOf( 'day' ).diff( moment.utc( childDoc.registrationDate ), 'years', true ) ).toFixed( 1 ),
			registrationDate: moment.utc( childDoc.registrationDate ).format( 'MM/DD/YYYY' ),
			addedToWebDate: childDoc.visibleInGalleryDate ? moment.utc( childDoc.visibleInGalleryDate ).format( 'MM/DD/YYYY' ) : 'N/A',
			mustBePlacedWithSiblings: childDoc.mustBePlacedWithSiblings ? 'Yes' : 'No',
			siblingsToBePlacedWith: childDoc.siblingsToBePlacedWith && childDoc.siblingsToBePlacedWith.length > 0
				? childDoc.siblingsToBePlacedWith.map( sibling => `${sibling.name.first} ${sibling.name.last}` ).join( ', ' )
				: '',
			hasPhotolistingPhoto: childDoc.hasPhotolistingPhoto ? 'Yes' : 'No',
			hasVideoSnapshot: childDoc.hasVideoSnapshot ? 'Yes' : 'No',
			onAdoptuskids: childDoc.onAdoptuskids ? 'Yes' : 'No',
			wednesdaysChild: childDoc.wednesdaysChild ? 'Yes' : 'No',
			wendysWonderfulKidsCaseloadEast: childDoc.wendysWonderfulKidsCaseloadEast || childDoc.wendysWonderfulKidsCaseloadEastSiblingGroup ? 'Yes' : 'No',
			wendysWonderfulKidsCaseloadWest: childDoc.wendysWonderfulKidsCaseloadWest || childDoc.wendysWonderfulKidsCaseloadWestSiblingGroup ? 'Yes' : 'No',
			coalitionMeeting: childDoc.coalitionMeeting ? 'Yes' : 'No',
			matchingEvent: childDoc.matchingEvent ? 'Yes' : 'No',
			weekendFamilyConnections: childDoc.weekendFamilyConnections ? 'Yes' : 'No',
			specializedRecruitment: childDoc.specializedRecruitment ? 'Yes' : 'No',
            identifiesAsLGBTQ: childDoc.identifiesAsLGBTQ || '--',
			displayImage: childDoc.image && childDoc.image.url ? childDoc.image.url : undefined
		}));

		// retrieve the adoption workers from the social worker response
		let adoptionWorkers = adoptionWorkerCriteria && adoptionWorkerCriteria.map( adoptionWorkerId => {
			let adoptionWorkerDoc = socialWorkerDocs.find( socialWorkerDoc => socialWorkerDoc._id.toString() === adoptionWorkerId );
			return {
				id: adoptionWorkerDoc._id.toString(),
				text: `${adoptionWorkerDoc.name.first} ${adoptionWorkerDoc.name.last}`
			}
		});

		// retrieve the recruitment workers from the social worker response
		let recruitmentWorkers = recruitmentWorkerCriteria && recruitmentWorkerCriteria.map( recruitmentWorkerId => {
			let recruitmentWorkerDoc = socialWorkerDocs.find( socialWorkerDoc => socialWorkerDoc._id.toString() === recruitmentWorkerId );
			return {
				id: recruitmentWorkerDoc._id.toString(),
				text: `${recruitmentWorkerDoc.name.first} ${recruitmentWorkerDoc.name.last}`
			}
		});

		// retrieve the adoption worker agencies from the social worker agency response
		let adoptionWorkerAgencies;
		if ( adoptionWorkerAgencyCriteria && adoptionWorkerAgencyCriteria.length > 0 ) {
			adoptionWorkerAgencies = utilsService.extractAgenicesData(
				adoptionWorkerAgencyCriteria.map( agencyId => socialWorkerAgencyDocs.find( adoptionWorkerAgencyDoc => adoptionWorkerAgencyDoc._id.toString() === agencyId ) )
			);
		}

		// retrieve the recruitment worker agencies from the social worker agency response
		let recruitmentWorkerAgencies;
		if ( recruitmentWorkerAgencyCriteria && recruitmentWorkerAgencyCriteria.length > 0 ) {
			recruitmentWorkerAgencies = utilsService.extractAgenicesData( 
				recruitmentWorkerAgencyCriteria.map( agencyId => socialWorkerAgencyDocs.find( recruitmentWorkerAgencyDoc => recruitmentWorkerAgencyDoc._id.toString() === agencyId ) ) 
			);
		}

		// if 'pdf' parameter was detected in the query, send the response as a PDF
		if ( query.pdf ) {
			utilsService.sendPDF( req, res, { results: childListings }, 'tools-child-listing-pdf', {
				headerTitle: 'Child Listing Report'
			});
		// otherwise, send the response data as an object to be rendered as a grid on the page
		} else {
			res.send({
				noResultsFound: !childDocs || childDocs.length === 0,
				results: childListings,
				adoptionWorkers,
				recruitmentWorkers,
				adoptionWorkerAgencies,
				recruitmentWorkerAgencies,
				limitReached: childListings.length === MAX_RESULTS
			});
		}
	})
	.catch( err => {
		// log an error for debugging purposes
		console.error( `error loading child listing report for the dashboard - ${ err }` );

		flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading child listing data' );
	});
};

exports.getFamilyListingData = ( req, res, next ) => {

	// set a maximum number of results that can be returned to prevent crashes/freezing
	const MAX_RESULTS = 5000;
	
	// get the query from the request object
	const query = req.query;

	// create the search criteria
	const searchCriteria = {};

	// registration date range criteria (required)
	const registrationDateFrom = new Date( query.regDateFrom );
	const registrationDateTo = new Date( query.regDateTo );
	searchCriteria.initialContact = { $gte: registrationDateFrom, $lte: registrationDateTo };

	// family is homestudy verified
	if ( !!query.homestudyVerified ) {
		searchCriteria['permissions.isHomestudyVerified'] = true;
	}

	// family's current stage
	if ( query[ 'current-stage' ] ) {
		// the value of the current stage is the path to the checkbox (bool) field on the family model
		searchCriteria[ query[ 'current-stage' ] ] = true;
	}
	
	// family constellation criteria (multiple)
	if ( Array.isArray( query[ 'family-constellation' ] ) && query[ 'family-constellation' ].length > 0 ) {
		searchCriteria.familyConstellation = { $in: query[ 'family-constellation' ] };
	}

	// family region criteria (multiple)
	if ( Array.isArray( query[ 'family-region' ] ) && query[ 'family-region' ].length > 0 ) {
		searchCriteria[ 'address.region' ] = { $in: query[ 'family-region' ] };
	}

	// family region criteria (multiple)
	if ( Array.isArray( query[ 'family-state' ] ) && query[ 'family-state' ].length > 0 ) {
		searchCriteria[ 'address.state' ] = { $in: query[ 'family-state' ] };
	}

	// contact 1 gender (multiple)
	if ( Array.isArray( query[ 'contact-1-gender' ] ) && query[ 'contact-1-gender' ].length > 0 ) {
		searchCriteria[ 'contact1.gender' ] = { $in: query[ 'contact-1-gender' ] };
	}

	// contact 2 gender (multiple)
	if ( Array.isArray( query[ 'contact-2-gender' ] ) && query[ 'contact-2-gender' ].length > 0 ) {
		searchCriteria[ 'contact2.gender' ] = { $in: query[ 'contact-2-gender' ] };
	}

	// contact 1 race (multiple)
	if ( Array.isArray( query[ 'contact-1-race' ] ) && query[ 'contact-1-race' ].length > 0 ) {
		searchCriteria[ 'contact1.race' ] = { $in: query[ 'contact-1-race' ] };
	}

	// contact 2 race (multiple)
	if ( Array.isArray( query[ 'contact-2-race' ] ) && query[ 'contact-2-race' ].length > 0 ) {
		searchCriteria[ 'contact2.race' ] = { $in: query[ 'contact-2-race' ] };
	}

	// family social worker (multiple)
	if ( Array.isArray( query[ 'social-worker' ] ) && query[ 'social-worker' ].length > 0 ) {
		searchCriteria.socialWorker = { $in: query[ 'social-worker' ] };
	}

	// family social worker agency (multiple)
	if ( Array.isArray( query[ 'social-worker-agency' ] ) && query[ 'social-worker-agency' ].length > 0 ) {
		searchCriteria.socialWorkerAgency = { $in: query[ 'social-worker-agency' ] };
	}

	// family social worker region (multiple)
	if ( Array.isArray( query[ 'social-worker-region' ] ) && query[ 'social-worker-region' ].length > 0 ) {
		searchCriteria.socialWorkerAgencyRegion = { $in: query[ 'social-worker-region' ] };
	}

	// family services (multiple)
	if ( Array.isArray( query[ 'family-services' ] ) && query[ 'family-services' ].length > 0 ) {

		searchCriteria[ '$or' ] = searchCriteria[ '$or' ] || [];
		for ( const service of query[ 'family-services' ] ) {
			searchCriteria[ '$or' ].push({ [service]: true });
		}
	}

	// family status criteria (multiple)
	if ( Array.isArray( query[ 'family-status' ] ) && query[ 'family-status' ].length > 0 ) {
		searchCriteria[ 'registeredWithMARE.status' ] = { $in: query[ 'family-status' ] };
	}

	Promise.all([
		// get the families that match the specified date range and criteria
		keystone.list( 'Family' ).model
			.find( searchCriteria )
			.limit( MAX_RESULTS )
			.populate([
				'familyConstellation',
				'address.region',
				'address.state',
				'socialWorker',
				'socialWorkerAgency',
				'socialWorkerAgencyRegion',
				'contact1.gender',
				'contact1.race',
				'contact2.gender',
				'contact2.race',
				'language',
				'otherLanguages',
				'registeredWithMARE.status'
			].join( ' ' ))
			.lean()
			.exec(),
		// if thare are any social worker criteria specified, get the social worker docs to seed the social worker selects on the search form
		searchCriteria.socialWorker
			? keystone.list( 'Social Worker' ).model
				.find( { _id: searchCriteria.socialWorker } )
				.lean()
				.exec()
				.catch( err => {
					// log an error for debugging purposes
					console.error( `error loading social workers for the family listing report dashboard - ${ err }` );
					// return false to allow the view to render regardless of the error
					return false;
				})
			: false,
		// if thare are adoption agency criteria specified, get the adoption agency docs to seed the select on the search form
		searchCriteria.socialWorkerAgency
			? keystone.list( 'Agency' ).model
				.find( { _id: searchCriteria.socialWorkerAgency } )
				.lean()
				.exec()
				.catch( err => {
					// log an error for debugging purposes
					console.error( `error loading agencies for the family listing report dashboard - ${ err }` );
					// return false to allow the view to render regardless of the error
					return false;
				})
			: false
	])
	.then( results => {

		const [ familyDocs, socialWorkers, socialWorkerAgencies ] = results;

		const familyListings = familyDocs.map(familyDoc => ({
			id: familyDoc._id.toString(),
			registrationNumber: familyDoc.registrationNumber,
			email: familyDoc.email,
			contact1: {
				firstName: familyDoc.contact1.name.first,
				lastName: familyDoc.contact1.name.last,
				fullName: `${familyDoc.contact1.name.first} ${familyDoc.contact1.name.last}`,
				email: familyDoc.contact1.email,
				gender: familyDoc.contact1.gender && familyDoc.contact1.gender.gender,
				race: familyDoc.contact1.race && familyDoc.contact1.race.length > 0
					? familyDoc.contact1.race.map( race => race.race ).join( ', ' )
					: undefined
			},
			contact2: {
				firstName: familyDoc.contact2.name.first,
				lastName: familyDoc.contact2.name.last,
				fullName: `${familyDoc.contact2.name.first} ${familyDoc.contact2.name.last}`,
				email: familyDoc.contact2.email !== '' ? familyDoc.contact2.email : undefined,
				gender: familyDoc.contact2.gender && familyDoc.contact2.gender.gender,
				race: familyDoc.contact2.race && familyDoc.contact2.race.length > 0
					? familyDoc.contact2.race.map( race => race.race ).join( ', ' )
					: undefined
			},
			constellation: familyDoc.familyConstellation && familyDoc.familyConstellation.familyConstellation,
			region: familyDoc.address.region && familyDoc.address.region.region,
			state: familyDoc.address.state && familyDoc.address.state.state,
			socialWorker: familyDoc.socialWorker && familyDoc.socialWorker.name.full,
			socialWorkerAgency: familyDoc.socialWorkerAgency && familyDoc.socialWorkerAgency.code,
			socialWorkerAgencyRegion: familyDoc.socialWorkerAgencyRegion && familyDoc.socialWorkerAgencyRegion.region,
			language: familyDoc.language && familyDoc.language.language,
			otherLanguages: familyDoc.otherLanguages && familyDoc.otherLanguages.length > 0
				? familyDoc.otherLanguages.map( language => language.language ).join( ', ' )
				: undefined,
			numberOfChildren: familyDoc.numberOfChildren,
			numberOfAdults: familyDoc.otherAdultsInHome && familyDoc.otherAdultsInHome.number,
			initialContactDate: moment.utc( familyDoc.initialContact ).format( 'MM/DD/YYYY' ),
			isHomestudyVerified: familyDoc.permissions.isHomestudyVerified,
			isActive: familyDoc.isActive,
			status: familyDoc.registeredWithMARE.registered 
				? familyDoc.registeredWithMARE.status
					? familyDoc.registeredWithMARE.status.familyStatus
					: 'registered (no status)'
				: 'ungregistered',
			stages: utilsService.getFamilyStagesData( familyDoc ),
			currentStage: utilsService.getCurrentFamilyStage( familyDoc ),
			services: utilsService.getFamilyServices( familyDoc )
		}));

		// if 'pdf' parameter was detected in the query, send the response as a PDF
		if ( query.pdf ) {
			utilsService.sendPDF( req, res, { results: familyListings }, 'tools-family-listing-pdf', {
				headerTitle: 'Family Listing Report'
			});
		// otherwise, send the response data as an object to be rendered as a grid on the page
		} else {
			res.send({
				noResultsFound: !familyDocs || familyDocs.length === 0,
				results: familyListings,
				socialWorkers: utilsService.extractSocialWorkersData( socialWorkers || [] ),
				socialWorkerAgencies: utilsService.extractAgenicesData( socialWorkerAgencies || [] ),
				limitReached: familyListings.length === MAX_RESULTS
			});
		}
	})
	.catch( err => {
		
		// log an error for debugging purposes
		console.error( `error loading family listing report for the dashboard - ${ err }` );

		flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading family listing data' );
	});
};

exports.getFamilyStagesData = ( req, res, next ) => {

	// set a maximum number of results that can be returned to prevent crashes/freezing
	const MAX_RESULTS = 5000;
	
	// get the query from the request object
	const query = req.query;

	// create the search criteria
	let searchCriteria = {};
	// create a list of required criteria
	let requiredSearchCriteria = {};

	// initial contact date queries
	if ( query.initialContactDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.initialContactDateType,
			query.initialContactDateValue,
			'initialContact',
			searchCriteria
		);
		requiredSearchCriteria[ 'initialContact' ] = !!query.initialContactDateRequired;
	}

	// homestudy verified date queries
	if ( query.homestudyVerifiedDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.homestudyVerifiedDateType,
			query.homestudyVerifiedDateValue,
			'permissions.homestudyVerifiedDate',
			searchCriteria
		);
		requiredSearchCriteria[ 'permissions.homestudyVerifiedDate' ] = !!query.homestudyVerifiedDateRequired;
	}

	// info packet date queries
	if ( query.infoPacketSentDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.infoPacketSentDateType,
			query.infoPacketSentDateValue,
			'infoPacket.date',
			searchCriteria
		);
		requiredSearchCriteria[ 'infoPacket.date' ] = !!query.infoPacketSentDateRequired;
	}

	// gathering information date queries
	if ( query.gatheringInformationDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.gatheringInformationDateType,
			query.gatheringInformationDateValue,
			'stages.gatheringInformation.date',
			searchCriteria
		);
		requiredSearchCriteria[ 'stages.gatheringInformation.date' ] = !!query.gatheringInformationDateRequired;
	}

	// looking for agency date queries
	if ( query.lookingForAgencyDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.lookingForAgencyDateType,
			query.lookingForAgencyDateValue,
			'stages.lookingForAgency.date',
			searchCriteria
		);
		requiredSearchCriteria[ 'stages.lookingForAgency.date' ] = !!query.lookingForAgencyDateRequired;
	}

	// working with agency date queries
	if ( query.workingWithAgencyDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.workingWithAgencyDateType,
			query.workingWithAgencyDateValue,
			'stages.workingWithAgency.date',
			searchCriteria
		);
		requiredSearchCriteria[ 'stages.workingWithAgency.date' ] = !!query.workingWithAgencyDateRequired;
	}

	// MAPP training complete date queries
	if ( query.mappTrainingCompletedDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.mappTrainingCompletedDateType,
			query.mappTrainingCompletedDateValue,
			'stages.MAPPTrainingCompleted.date',
			searchCriteria
		);
		requiredSearchCriteria[ 'stages.MAPPTrainingCompleted.date' ] = !!query.mappTrainingCompletedDateRequired;
	}

	// homestudy completed date queries
	if ( query.homestudyCompletedDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.homestudyCompletedDateType,
			query.homestudyCompletedDateValue,
			'homestudy.initialDate',
			searchCriteria
		);
		requiredSearchCriteria[ 'homestudy.initialDate' ] = !!query.homestudyCompletedDateRequired;
	}

	// registered with MARE date queries
	if ( query.registeredWithMAREDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.registeredWithMAREDateType,
			query.registeredWithMAREDateValue,
			'registeredWithMARE.date',
			searchCriteria
		);
		requiredSearchCriteria[ 'registeredWithMARE.date' ] = !!query.registeredWithMAREDateRequired;
	}

	// family profile created date queries
	if ( query.familyProfileCreatedDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.familyProfileCreatedDateType,
			query.familyProfileCreatedDateValue,
			'familyProfile.date',
			searchCriteria
		);
		requiredSearchCriteria[ 'familyProfile.date' ] = !!query.familyProfileCreatedDateRequired;
	}

	// closed date queries
	if ( query.closedDateType ) {
		utilsService.generateConfigurableDateFieldQuery(
			query.closedDateType,
			query.closedDateValue,
			'closed.date',
			searchCriteria
		);
		requiredSearchCriteria[ 'closed.date' ] = !!query.closedDateRequired;
	}

	// family region criteria (multiple)
	if ( Array.isArray( query[ 'family-region' ] ) && query[ 'family-region' ].length > 0 ) {
		searchCriteria[ 'address.region' ] = { $in: query[ 'family-region' ] };
		requiredSearchCriteria[ 'address.region' ] = !!query[ 'family-region-required' ];
	}

	// family region criteria (multiple)
	if ( Array.isArray( query[ 'family-state' ] ) && query[ 'family-state' ].length > 0 ) {
		searchCriteria[ 'address.state' ] = { $in: query[ 'family-state' ] };
		requiredSearchCriteria[ 'address.state' ] = !!query[ 'family-state-required' ];
	}

	// family status criteria (multiple)
	if ( Array.isArray( query[ 'family-status' ] ) && query[ 'family-status' ].length > 0 ) {
		searchCriteria[ 'registeredWithMARE.status' ] = { $in: query[ 'family-status' ] };
		requiredSearchCriteria[ 'registeredWithMARE.status' ] = !!query[ 'family-status-required' ];
	}

	// if the search type is 'any', change root of query to an $or statement so that if a record matches any of the 
	// search criteria it will be returned
	if ( query.searchType === 'any' ) {

		// keep a separate list of criteria required and optional criteria
		const requiredCriteria = [];
		const optionalCriteria = [];

		for ( const criterion of Object.keys( searchCriteria ) ) {
			// determine if criterion is required or optional
			const criteriaList = requiredSearchCriteria[ criterion ] ? requiredCriteria : optionalCriteria;
			// add criterion to appropriate list
			criteriaList.push({ [ criterion ]: searchCriteria[ criterion ] });
		}

		// if all criteria are required, there's no need to modify the original searchCriteria
		searchCriteria = optionalCriteria.length > 0
			? { $and: [ ...requiredCriteria, { $or: optionalCriteria } ] }
			: searchCriteria;
	}
	
	// get the families that match the specified date range and criteria
	keystone.list( 'Family' ).model
		.find( searchCriteria )
		.limit( MAX_RESULTS )
		.populate([
			'address.region',
			'address.state',
			'registeredWithMARE.status',
			'familyConstellation',
			'contact1.gender',
			'contact1.race',
			'contact2.gender',
			'contact2.race',
			'socialWorker',
			'socialWorkerAgency',
			'socialWorkerAgencyRegion',
			'language',
			'otherLanguages',
			'heardAboutMAREFrom'
		].join( ' ' ))
		.lean()
		.exec()
		.then( familyDocs => {

			const familyStages = familyDocs.map( familyDoc => ({
				id: familyDoc._id.toString(),
				registrationNumber: familyDoc.registrationNumber,
				email: familyDoc.email,
				contact1: {
					firstName: familyDoc.contact1.name.first,
					lastName: familyDoc.contact1.name.last,
					fullName: `${familyDoc.contact1.name.first} ${familyDoc.contact1.name.last}`,
					email: familyDoc.contact1.email,
					gender: familyDoc.contact1.gender && familyDoc.contact1.gender.gender,
					race: familyDoc.contact1.race && familyDoc.contact1.race.length > 0
						? familyDoc.contact1.race.map( race => race.race ).join( ', ' )
						: undefined
				},
				contact2: {
					firstName: familyDoc.contact2.name.first,
					lastName: familyDoc.contact2.name.last,
					fullName: `${familyDoc.contact2.name.first} ${familyDoc.contact2.name.last}`,
					email: familyDoc.contact2.email !== '' ? familyDoc.contact2.email : undefined,
					gender: familyDoc.contact2.gender && familyDoc.contact2.gender.gender,
					race: familyDoc.contact2.race && familyDoc.contact2.race.length > 0
						? familyDoc.contact2.race.map( race => race.race ).join( ', ' )
						: undefined
				},
				currentStage: utilsService.getCurrentFamilyStage( familyDoc ),
				region: familyDoc.address.region && familyDoc.address.region.region,
				state: familyDoc.address.state && familyDoc.address.state.state,
				constellation: familyDoc.familyConstellation && familyDoc.familyConstellation.familyConstellation,
				socialWorker: familyDoc.socialWorker && familyDoc.socialWorker.name.full,
				socialWorkerAgency: familyDoc.socialWorkerAgency && familyDoc.socialWorkerAgency.code,
				socialWorkerAgencyRegion: familyDoc.socialWorkerAgencyRegion && familyDoc.socialWorkerAgencyRegion.region,
				language: familyDoc.language && familyDoc.language.language,
				otherLanguages: familyDoc.otherLanguages && familyDoc.otherLanguages.length > 0
					? familyDoc.otherLanguages.map( language => language.language ).join( ', ' )
					: undefined,
				numberOfChildren: familyDoc.numberOfChildren,
				numberOfAdults: familyDoc.otherAdultsInHome && familyDoc.otherAdultsInHome.number,
				heardAboutMAREFrom: familyDoc.heardAboutMAREFrom && familyDoc.heardAboutMAREFrom.length > 0
					? familyDoc.heardAboutMAREFrom.map( source => source.wayToHearAboutMARE ).join( ', ' )
					: familyDoc.heardAboutMAREOther && familyDoc.heardAboutMAREOther !== ''
						? familyDoc.heardAboutMAREOther
						: undefined,
				services: utilsService.getFamilyServices( familyDoc ),
				isHomestudyVerified: familyDoc.permissions.isHomestudyVerified,
				isActive: familyDoc.isActive,
				initialContactDate: utilsService.verifyAndFormatDate( familyDoc.initialContact ),
				homestudyVerifiedDate: utilsService.verifyAndFormatDate( familyDoc.permissions.homestudyVerifiedDate ),
				infoPacketSentDate: utilsService.verifyAndFormatDate( familyDoc.infoPacket && familyDoc.infoPacket.date ),
				gatheringInformationDate: utilsService.verifyAndFormatDate( familyDoc.stages.gatheringInformation.date ),
				lookingForAgencyDate: utilsService.verifyAndFormatDate( familyDoc.stages.lookingForAgency.date ),
				workingWithAgencyDate: utilsService.verifyAndFormatDate( familyDoc.stages.workingWithAgency.date ),
				mappTrainingCompletedDate: utilsService.verifyAndFormatDate( familyDoc.stages.MAPPTrainingCompleted.date ),
				homestudyCompletedDate: utilsService.verifyAndFormatDate( familyDoc.homestudy.initialDate ),
				onlineMatchingDate: utilsService.verifyAndFormatDate( familyDoc.onlineMatching.date ),
				registeredWithMAREDate: utilsService.verifyAndFormatDate( familyDoc.registeredWithMARE.date ),
				familyProfileCreatedDate: utilsService.verifyAndFormatDate( familyDoc.familyProfile.date ),
				closedDate: utilsService.verifyAndFormatDate( familyDoc.closed.date ),
				status: familyDoc.registeredWithMARE.registered 
					? familyDoc.registeredWithMARE.status
						? familyDoc.registeredWithMARE.status.familyStatus
						: 'registered (no status)'
					: 'ungregistered',
			}));

			res.send({
				noResultsFound: !familyDocs || familyDocs.length === 0,
				results: familyStages,
				limitReached: familyStages.length === MAX_RESULTS
			});
		})
		.catch( err => {

			// log an error for debugging purposes
			console.error( `error loading family stages report for the dashboard - ${ err }` );
			flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading family stages data' );
		});
};

exports.getChildCaseloadData = ( req, res, next ) => {

    // set a maximum number of results that can be returned to prevent crashes/freezing
	const MAX_RESULTS = 5000;
	
	// get the query from the request object
	const query = req.query;

    // get the date range of the caseload search
	let fromDate = new Date( query.fromDate );
	let toDate = new Date( query.toDate );

	// ensure both fromDate and toDate are valid dates
	if ( isNaN( fromDate.getTime() ) || isNaN( toDate.getTime() ) ) {
		return flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading caseload data' );
	}

	// create the baseline search criteria with a date range
	let searchCriteria = {
		date: { $gte: fromDate, $lte: toDate }
	};

    keystone.list( 'Daily Child Count' ).model
        .find( searchCriteria )
        .populate( 'regionalCounts' )
        .lean()
        .exec()
        .then( dailyCountDocs => {

            const dailyCounts = dailyCountDocs.map( dailyCount => ({
                date: moment.utc( dailyCount.date ).format( 'MM/DD/YYYY' ),
                totalCases: calculateTotalCases( dailyCount.regionalCounts ),
                totalActiveProfiles: dailyCount.totalActiveProfiles,
                totalProfilesVisibleToAll: dailyCount.totalProfilesVisibleToAll,
                regionalCounts: {
                    boston: dailyCount.regionalCounts.find( regionalCount => regionalCount.region === 'Boston' ),
                    northern: dailyCount.regionalCounts.find( regionalCount => regionalCount.region === 'Northern' ),
                    southern: dailyCount.regionalCounts.find( regionalCount => regionalCount.region === 'Southern' ),
                    western: dailyCount.regionalCounts.find( regionalCount => regionalCount.region === 'Western' ),
                    central: dailyCount.regionalCounts.find( regionalCount => regionalCount.region === 'Central' ),
                    specialized: dailyCount.regionalCounts.find( regionalCount => regionalCount.region === 'Specialized Recruitment Coordination' ),
                    outOfState: dailyCount.regionalCounts.find( regionalCount => regionalCount.region === 'Out of state' )
                }
            }));

            let totalCaseload = 0;
            let totalActiveProfiles = 0;
            dailyCounts.forEach( dailyCount => {
                // increment totals
                totalCaseload += dailyCount.totalCases;
                totalActiveProfiles += dailyCount.totalActiveProfiles;
                // calculate % of active cases without active profiles
                dailyCount.inactiveProfilePercentage = `${parseFloat( ( 1 -  dailyCount.totalActiveProfiles / dailyCount.totalCases ) * 100 ).toFixed( 2 )}%`;
            });

            res.send({
                noResultsFound: !dailyCountDocs || dailyCountDocs.length === 0,
				results: dailyCounts,
                averages: {
                    activeCaseload: Math.round( totalCaseload / dailyCounts.length ),
                    activeProfiles: Math.round( totalActiveProfiles / dailyCounts.length )
                },
                metadata: {
                    excelExportFilename: `Caseload Report ${moment( fromDate ).format( 'YYYY-MM-DD' )} - ${moment( toDate ).format( 'YYYY-MM-DD' )}.xlsx`
                }
            });
        })
        .catch( error => {

            // log an error for debugging purposes
            console.error( `error loading child caseload report for the dashboard - ${ error }` );

            flashMessages.sendErrorFlashMessage( res, 'Error', 'Error loading child caseload data' );
        });

    function calculateTotalCases( regionalCounts ) {
            
        let totalCases = 0;
        for ( const [key, value] of Object.entries( regionalCounts ) ) {
            totalCases += value.childCounts.active;
        }
        return totalCases;
    }
};