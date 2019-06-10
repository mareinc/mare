const keystone				= require( 'keystone' ),
	  _						= require( 'underscore' ),
	  moment				= require( 'moment' ),
	  toolsService			= require( '../middleware/service_tools' ),
	  childService			= require( '../middleware/service_child' ),
	  ObjectId 				= require('mongodb').ObjectId;

// TODO:
const FIELD_NAMES = {
	status: "Status",
	gender: "Gender",
	race: "Race",
	legalStatus: "Legal Status",
	age: "Age",
	siblingGroupSize: "Sibling Group Size",
	physicalNeeds: "Physical Needs",
	intellectualNeeds: "Intellectual Needs",
	emotionalNeeds: "Emotional Needs",
	adoptionWorkersAgency: "Adoption Worker's Agency",
	recruitmentWorkersAgency: "Recruitment Worker's Agency",
	adoptionWorker: "Adoption Workers",
	recruitmentWorker: "Recruitment Workers"
};
const MAX_RESULTS = 10000;

function getValidCriteria( query ) {
	let criteria = {};
	
	// status criteria (multiple)
	if ( Array.isArray( query.status ) && query.status.length > 0 ) {
		let filtered = query.status.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'registeredWithMARE.status' ] = { $in: filtered };
			criteria[ 'registeredWithMARE.registered' ] = true;
		}
	}
	
	// gender criteria (multiple)
	if ( Array.isArray( query.gender ) && query.gender.length > 0 ) {
		let filtered = query.gender.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'matchingPreferences.gender' ] = { $in: filtered };
		}
	}
	
	// race criteria (multiple)
	if ( Array.isArray( query.race ) && query.race.length > 0 ) {
		let filtered = query.race.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'matchingPreferences.race' ] = { $in: filtered };
		}
	}
	
	// legal status criteria (multiple)
	if ( Array.isArray( query.legalStatus ) && query.legalStatus.length > 0 ) {
		let filtered = query.legalStatus.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'matchingPreferences.legalStatus' ] = { $in: filtered };
		}
	}
	
	// legal status criteria (multiple)
	if ( Array.isArray( query.familyConstellation ) && query.familyConstellation.length > 0 ) {
		let filtered = query.familyConstellation.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'familyConstellation' ] = { $in: filtered };
		}
	}
	
	// lower and upper ages criteria
	let dateQuery = {};
	if ( !isNaN( parseInt( query.agesFrom ) ) ) {
		criteria[ 'matchingPreferences.adoptionAges.from' ] = { $gte: parseInt( query.agesFrom ) };
	}
	if ( !isNaN( parseInt( query.agesTo ) ) ) {
		criteria[ 'matchingPreferences.adoptionAges.to' ] = { $lte: parseInt( query.agesTo ) };
	}
	
	// lower and upper number of siblings
	let siblingGroupSizeFrom = parseInt( query.siblingGroupSizeFrom );
	if ( !isNaN( siblingGroupSizeFrom ) && siblingGroupSizeFrom >= 1 ) {
		criteria[ 'matchingPreferences.minNumberOfChildrenToAdopt' ] = { $gte: siblingGroupSizeFrom };
	}
	let siblingGroupSizeTo = parseInt( query.siblingGroupSizeTo );
	if ( !isNaN( siblingGroupSizeTo ) && siblingGroupSizeTo >= 1 ) {
		criteria[ 'matchingPreferences.maxNumberOfChildrenToAdopt' ] = { $lte: siblingGroupSizeTo };
	}
	
	// physical needs:
	if ( query.physicalNeedsFrom || query.physicalNeedsTo ) {
		let physicalNeedsCriteria = toolsService.getPhysicalNeedsRange( query.physicalNeedsFrom, query.physicalNeedsTo );
		if ( physicalNeedsCriteria.length > 0 ) {
			criteria[ 'matchingPreferences.maxNeeds.physical' ] = { $in: physicalNeedsCriteria };
		}
	}
	
	// intellectual needs:
	if ( query.intellectualNeedsFrom || query.intellectualNeedsTo ) {
		let intellectualNeedsCriteria = toolsService.getIntellectualNeedsRange( query.intellectualNeedsFrom, query.intellectualNeedsTo );
		if ( intellectualNeedsCriteria.length > 0 ) {
			criteria[ 'matchingPreferences.maxNeeds.intellectual' ] = { $in: intellectualNeedsCriteria };
		}
	}
	
	// emotional needs:
	if ( query.emotionalNeedsFrom || query.emotionalNeedsTo ) {
		let emotionalNeedsCriteria = toolsService.getIntellectualNeedsRange( query.emotionalNeedsFrom, query.emotionalNeedsTo );
		if ( emotionalNeedsCriteria.length > 0 ) {
			criteria[ 'matchingPreferences.maxNeeds.emotional' ] = { $in: emotionalNeedsCriteria };
		}
	}
	
	// social worker's agency criteria (multiple)
	if ( Array.isArray( query.socialWorkersAgency ) && query.socialWorkersAgency.length > 0 ) {
		let filtered = query.socialWorkersAgency.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'socialWorkerAgency' ] = { $in: filtered };
		}
	}
	
	// social worker criteria (multiple)
	if ( Array.isArray( query.socialWorkers ) && query.socialWorkers.length > 0 ) {
		let filtered = query.socialWorkers.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'socialWorker' ] = { $in: filtered };
		}
	}
	
	return criteria;
}

function getResultsPromise( criteria ) {
	if ( ! _.isEmpty( criteria ) ) {
		return new Promise( ( resolve, reject ) => {
			keystone.list( 'Family' ).model
				.find( criteria )
				.sort( { 'displayName' : 'asc' } )
				.limit( MAX_RESULTS )
				.populate( 'contact1.race' )
				.populate( 'contact2.race' )
				.populate( 'address.city' )
				.populate( 'address.state' )
				.populate( 'socialWorker' )
				.populate( 'socialWorkerAgency' )
				.exec()
				.then(
					results => resolve( results ), 
					err => reject( err )
				);
		});
	} else {
		return new Promise( ( resolve, reject ) => resolve( [] ) );
	}
}

function processResults( results, criteria, includeFields ) {
	let mapper = ( family ) => {
		let fields = [];
		
		for ( let field in includeFields ) {
			let value = '';

			// TODO:
			switch ( field ) {
				case 'status':
					value = child.status ? child.status.childStatus : '';
					break;
				case 'gender':
					value = family.matchingPreferences.gender ? family.matchingPreferences.gender.gender : '';
					break;
				case 'race':
					value = Array.isArray( child.race ) ? child.race.map( ( race ) => race.race ).join( ', ' ) : '';
					break;
				case 'legalStatus':
					value = child.legalStatus ? child.legalStatus.legalStatus : '';
					break;
				case 'age':
					value = child.birthDate ? moment().diff( child.birthDate, 'years', false ) : '';
					break;	
				case 'siblingGroupSize':
					value = Array.isArray( child.siblings ) ? child.siblings.length + 1 : '';
					break;
				case 'physicalNeeds':
					value = child.physicalNeeds ? child.physicalNeeds : '';
					break;
				case 'intellectualNeeds':
					value = child.intellectualNeeds ? child.intellectualNeeds : '';
					break;
				case 'emotionalNeeds':
					value = child.emotionalNeeds ? child.emotionalNeeds : '';
					break;
				case 'adoptionWorkersAgency':
					value = child.adoptionWorkerAgency ? child.adoptionWorkerAgency.name : '';
					break;
				case 'recruitmentWorkersAgency':
					value = child.recruitmentWorkerAgency ? child.recruitmentWorkerAgency.name : '';
					break;
				case 'adoptionWorker':
					value = child.adoptionWorker ? child.adoptionWorker.name.full : '';
					break;
				case 'recruitmentWorker':
					value = child.recruitmentWorker ? child.recruitmentWorker.name.full : '';
					break;
			}
			
			fields.push( value );
		}
		
		
		return {
			id: family._id,
			registrationNumber: family.registrationNumber,
			name: family.displayName,
			contact1name: family.contact1.name.full,
			contact1race: family.contact1.race.map( ( race) => race.race ).join( ', ' ),
			contact2name: family.contact2.name.full,
			contact2race: family.contact2.race.map( ( race) => race.race ).join( ', ' ),
			socialWorker: family.socialWorker ? family.socialWorker.name.full : family.socialWorkerText,
			socialWorkerAgency: family.socialWorkerAgency ? family.socialWorkerAgency.code : '',
			city: family.address.city ? family.address.city.cityOrTown : family.address.cityText,
			state: family.address.state ? family.address.state.abbreviation : '',
			fields: fields
		}
	};
	
	return results.map( mapper );
}

function sortResults( results ) {
	return results.sort( ( a, b ) => a.name.localeCompare( b.name ) );
}

function getFieldsFromQuery( query ) {
	let fields = {};
	
	if ( Array.isArray( query.fields ) ) {
		query.fields.forEach( ( field ) => {
			fields[ field ] = true;
		});
	}
	
	return fields;
}

function getReportFieldNamesFromQuery( query ) {
	return Array.isArray( query.fields ) ? query.fields.filter( ( field ) => FIELD_NAMES[ field ] ).map( ( field ) => FIELD_NAMES[ field ] ) : [];
}

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  userType	= req.user ? req.user.userType : '',
		  locals	= res.locals;
	let childId = req.query.child;
	
	// access to admins only
	if ( userType.length === 0 || userType !== 'admin' ) {
		res.statusCode = 403;
		res.setHeader( 'Content-Type', 'text/plain' );
		res.end( 'Access denied' );
		return;
	}
	
	if ( typeof childId === 'undefined' ) {
		view.render( 'tools-child-matching-request-child', { layout: 'dashboard' } );
	} else {
		childService.getChildById( { id: childId } ).then( child => {
			
			let preferences = child;
			let criteria = getValidCriteria( req.query );
			let emptyCriteria = _.isEmpty( criteria );
			let statusesPromise = toolsService.getChildStatusesOptions(
					emptyCriteria && child.status ? [ child.status.toString() ] : req.query.status
				),
				gendersPromise = toolsService.getGendersOptions(
					emptyCriteria && child.gender ? [ child.gender.toString() ] : req.query.gender 
				),
				racesPromise = toolsService.getRacesOptions(
					emptyCriteria && Array.isArray( child.race ) ? child.race.map( ( race ) => race.toString() ) : req.query.race
				),
				legalStatusesPromise = toolsService.getLegalStatusesOptions(
					emptyCriteria && child.legalStatus ?  [ child.legalStatus.toString() ] : req.query.legalStatus
				),
				familyConstellationsPromise = toolsService.getFamilyConstellationsOptions(
					emptyCriteria && Array.isArray( child.recommendedFamilyConstellation ) ? child.recommendedFamilyConstellation.map( ( constellation ) => constellation.toString() ) : req.query.familyConstellation
				),
				socialWorkersPromise = toolsService.getSocialWorkersOptions(
					emptyCriteria && child.adoptionWorker ? [ child.adoptionWorker.toString() ] : req.query.socialWorkers
				),
				socialWorkersAgenciesPromise = toolsService.getAgenciesOptions( 
					emptyCriteria && child.adoptionWorkerAgency ? [ child.adoptionWorkerAgency.toString() ] : req.query.socialWorkersAgency
				),
				resultsPromise = getResultsPromise( criteria )
				;

			Promise.all( [ 
					statusesPromise, gendersPromise, racesPromise, familyConstellationsPromise,
					legalStatusesPromise, socialWorkersPromise, socialWorkersAgenciesPromise, resultsPromise
				] )
				.then( values => {
					// assign local variables to the values returned by the promises
					const [ statuses, genders, races, familyConstellations,
						legalStatuses, socialWorkers, socialWorkersAgencies, results ] = values;
					
					// assign properties to locals for access during templating
					locals.child = child._id;
					locals.childDisplayNameAndRegistration = child.displayNameAndRegistration;
					locals.statuses = statuses;
					locals.genders = genders;
					locals.races = races;
					locals.legalStatuses = legalStatuses;
					locals.familyConstellations = familyConstellations;
					locals.agesFrom = toolsService.getAgesOptions(
						emptyCriteria && preferences.birthDate ? moment().diff(preferences.birthDate, 'years') : req.query.agesFrom
					);
					locals.agesTo = toolsService.getAgesOptions(
						req.query.agesTo
					);
					locals.siblingGroupSizeFrom = toolsService.getSiblingGroupSizesOptions(
						emptyCriteria && preferences.siblings ? preferences.siblings.length : req.query.siblingGroupSizeFrom
					);
					locals.siblingGroupSizeTo = toolsService.getSiblingGroupSizesOptions(
						req.query.siblingGroupSizeTo
					);
					locals.physicalNeedsFrom = toolsService.getPhysicalNeedsOptions(
						emptyCriteria && preferences.physicalNeeds ? preferences.physicalNeeds : req.query.physicalNeedsFrom
					);
					locals.physicalNeedsTo = toolsService.getPhysicalNeedsOptions(
						req.query.physicalNeedsTo
					);
					locals.intellectualNeedsFrom = toolsService.getIntellectualNeedsOptions(
						emptyCriteria && preferences.intellectualNeeds ? preferences.intellectualNeeds : req.query.intellectualNeedsFrom
					);
					locals.intellectualNeedsTo = toolsService.getIntellectualNeedsOptions(
						req.query.intellectualNeedsTo
					);
					locals.emotionalNeedsFrom = toolsService.getEmotionalNeedsOptions(
						emptyCriteria && preferences.emotionalNeeds ? preferences.emotionalNeeds : req.query.emotionalNeedsFrom
					);
					locals.emotionalNeedsTo = toolsService.getEmotionalNeedsOptions(
						req.query.emotionalNeedsTo
					);
					locals.socialWorkers = socialWorkers;
					locals.socialWorkersAgencies = socialWorkersAgencies;
					locals.fields = getFieldsFromQuery( req.query );
					locals.fieldNames = getReportFieldNamesFromQuery( req.query );
					locals.siblingsCellColSpan = Object.keys( locals.fields ).length + 1;
					locals.nonEmptyCriteria = !emptyCriteria;
					locals.results = sortResults( processResults( results, criteria, locals.fields ) );
					
					if ( req.query.pdf ) {
						view.render( 'tools-child-matching-pdf', { layout: null }, function(error, html) {
							//res.send( unescapeHTML( html ) );
							
							const convertHTMLToPDF = require( "pdf-puppeteer" );
							var callback = function ( pdf ) {
								res.setHeader( "Content-Type", "application/pdf" );
								res.send( pdf );
							}
							
							const pageOptions = {
								width: "11 in",
								height: "8.5 in",
								margin : {
									top: '1 in',
									right: '0.5 in',
									bottom: '0.5 in',
									left: '0.5 in'
								},
								displayHeaderFooter: true,
								headerTemplate: '<span style="font-size: 18px; margin-left: 45px;">Massachusetts Adoption Resource Exchange, Inc.<br><span style="font-size: 16px;">Child Match Criteria Listing</span></span>',	
								footerTemplate : '<span class="pageNumber" style="font-size: 10px; margin-left: 45px; text-align: center;"></span><span class="date" style="font-size: 10px; margin-left: 45px; text-align: right"></span>'
							};
							
							convertHTMLToPDF( toolsService.unescapeHTML( html ), callback, pageOptions );
						});
						
					} else {
						view.render( 'tools-child-matching', { layout: 'dashboard' } );
					}
				})
				.catch( err => {
					console.error( `error loading data for the dashboard - ${ err }` );
					
					view.render( 'tools-child-matching', { layout: 'dashboard' } );
				});
		})
		.catch( err => {
			console.error( `error loading data for the dashboard - ${ err }` );
			
			locals.familyNotFound = true;
			
			view.render( 'tools-child-matching-request-child', { layout: 'dashboard' } );
		});
	}
	
};
