const keystone 			= require( 'keystone' ),
	  ObjectId 			= require( 'mongodb' ).ObjectId,
	  _					= require( 'underscore' ),
	  moment			= require( 'moment' ),
	  utilsService		= require( './utils.controllers' );

const FIELD_NAMES = {
	status: "Status",
	gender: "Gender",
	race: "Race",
	legalStatus: "Legal Status",
	familyConstellation: "Family Constellation",
	age: "Age",
	siblingGroupSize: "Sibling Group Size",
	physicalNeeds: "Physical Needs",
	intellectualNeeds: "Intellectual Needs",
	emotionalNeeds: "Emotional Needs",
	socialNeeds: "Social Needs",
	adoptionWorkersAgency: "Adoption Worker's Agency",
	recruitmentWorkersAgency: "Recruitment Worker's Agency",
	adoptionWorker: "Adoption Workers",
	recruitmentWorker: "Recruitment Workers"
};

const MAX_RESULTS = 10000;

/* parse query parameters and output MongoDB search criteria */
exports.getCriteria = query => {
	let criteria = {};
	
	// status criteria (multiple)
	if ( Array.isArray( query.status ) && query.status.length > 0 ) {
		let filtered = query.status.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'status' ] = { $in: filtered };
		}
	}
	
	// gender criteria (multiple)
	if ( Array.isArray( query.gender ) && query.gender.length > 0 ) {
		let filtered = query.gender.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'gender' ] = { $in: filtered };
		}
	}
	
	// race criteria (multiple)
	if ( Array.isArray( query.race ) && query.race.length > 0 ) {
		let filtered = query.race.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'race' ] = { $in: filtered };
		}
	}
	
	// legal status criteria (multiple)
	if ( Array.isArray( query.legalStatus ) && query.legalStatus.length > 0 ) {
		let filtered = query.legalStatus.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'legalStatus' ] = { $in: filtered };
		}
	}
	
	// family constellation criteria (multiple)
	if ( Array.isArray( query.familyConstellation ) && query.familyConstellation.length > 0 ) {
		let filtered = query.familyConstellation.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'recommendedFamilyConstellation' ] = { $in: filtered };
		}
	}
	
	// lower and upper ages criteria
	let dateQuery = {};
	if ( !isNaN( parseInt( query.agesFrom ) ) ) {
		let lowerDate = moment().subtract( parseInt( query.agesFrom ), "years" ).format( 'YYYY-MM-DD' );
		dateQuery.$lte = new Date( lowerDate + "T00:00:00.000Z" );
	}
	if ( !isNaN( parseInt( query.agesTo ) ) ) {
		let upperDate = moment().subtract( parseInt( query.agesTo ) + 1, "years" ).format( 'YYYY-MM-DD' );
		dateQuery.$gt = new Date( upperDate + "T00:00:00.000Z" );
	}
	if ( !_.isEmpty( dateQuery ) ) {
		criteria[ 'birthDate' ] = dateQuery;
	}
	
	// lower and upper number of siblings
	let siblingsCriteria = [];
	let siblingGroupSizeFrom = parseInt( query.siblingGroupSizeFrom );
	if ( !isNaN( siblingGroupSizeFrom ) && siblingGroupSizeFrom >= 1 ) {
		siblingsCriteria.push( { $expr: { $gte: [ { $size: "$siblingsToBePlacedWith" }, siblingGroupSizeFrom - 1 ] } } );
	}
	let siblingGroupSizeTo = parseInt( query.siblingGroupSizeTo );
	if ( !isNaN( siblingGroupSizeTo ) && siblingGroupSizeTo >= 1 ) {
		siblingsCriteria.push( { $expr: { $lte: [ { $size: "$siblingsToBePlacedWith" }, siblingGroupSizeTo - 1 ] } } );
	}
	if ( siblingsCriteria.length === 1 ) {
		criteria.$expr = siblingsCriteria[0].$expr;
	} else if ( siblingsCriteria.length === 2 ) {
		criteria.$and = siblingsCriteria;
	}
	
	// physical needs
	if ( query.physicalNeedsFrom || query.physicalNeedsTo ) {
		let physicalNeedsCriteria = utilsService.getPhysicalNeedsRange( query.physicalNeedsFrom, query.physicalNeedsTo );
		if ( physicalNeedsCriteria.length > 0 ) {
			criteria[ 'physicalNeeds' ] = { $in: physicalNeedsCriteria };
		}
	}
	
	// intellectual needs
	if ( query.intellectualNeedsFrom || query.intellectualNeedsTo ) {
		let intellectualNeedsCriteria = utilsService.getIntellectualNeedsRange( query.intellectualNeedsFrom, query.intellectualNeedsTo );
		if ( intellectualNeedsCriteria.length > 0 ) {
			criteria[ 'intellectualNeeds' ] = { $in: intellectualNeedsCriteria };
		}
	}
	
	// emotional needs
	if ( query.emotionalNeedsFrom || query.emotionalNeedsTo ) {
		let emotionalNeedsCriteria = utilsService.getIntellectualNeedsRange( query.emotionalNeedsFrom, query.emotionalNeedsTo );
		if ( emotionalNeedsCriteria.length > 0 ) {
			criteria[ 'emotionalNeeds' ] = { $in: emotionalNeedsCriteria };
		}
	}
	
	// social needs
	if ( query.socialNeeds ) {
		criteria[ 'socialNeeds' ] = query.socialNeeds;
	}
	
	// adoption worker's agency criteria (multiple)
	if ( Array.isArray( query.adoptionWorkersAgency ) && query.adoptionWorkersAgency.length > 0 ) {
		let filtered = query.adoptionWorkersAgency.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'adoptionWorkerAgency' ] = { $in: filtered };
		}
	}
	
	// recruitment worker's agency criteria (multiple)
	if ( Array.isArray( query.recruitmentWorkersAgency ) && query.recruitmentWorkersAgency.length > 0 ) {
		let filtered = query.recruitmentWorkersAgency.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'recruitmentWorkerAgency' ] = { $in: filtered };
		}
	}
	
	// adoption worker criteria (multiple)
	if ( Array.isArray( query.adoptionWorkers ) && query.adoptionWorkers.length > 0 ) {
		let filtered = query.adoptionWorkers.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'adoptionWorker' ] = { $in: filtered };
		}
	}
	
	// recruitment worker criteria (multiple)
	if ( Array.isArray( query.recruitmentWorkers ) && query.recruitmentWorkers.length > 0 ) {
		let filtered = query.recruitmentWorkers.filter( ( objectId ) => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'recruitmentWorker' ] = { $in: filtered };
		}
	}
	
	return criteria;
}

exports.getChildrenByCriteria = criteria => {
	
	return new Promise( ( resolve, reject ) => {
		if ( _.isEmpty( criteria ) ) {
			resolve( [] );
		} else {
			keystone.list( 'Child' ).model
				.find( criteria )
				.sort( { 'name.full' : 'asc' } )
				.limit( MAX_RESULTS )
				.populate( 'status', { childStatus: 1 } )
				.populate( 'gender', { gender: 1 } )
				.populate( 'race', { race: 1 } )
				.populate( 'legalStatus', { legalStatus: 1 } )
				.populate( 'recommendedFamilyConstellation', { familyConstellation: 1 } )
				.populate( 'siblingsToBePlacedWith', {
					registrationNumber: 1,
					name: 1,
					status: 1,
					gender: 1,
					race: 1,
					legalStatus: 1,
					recommendedFamilyConstellation: 1,
					birthDate: 1,
					physicalNeeds: 1,
					intellectualNeeds: 1,
					emotionalNeeds: 1,
					socialNeeds: 1,
					adoptionWorkerAgency: 1,
					recruitmentWorkerAgency: 1,
					adoptionWorker: 1,
					recruitmentWorker: 1
				})
				.populate( 'adoptionWorkerAgency', { name: 1 } )
				.populate( 'recruitmentWorkerAgency', { name: 1 } )
				.populate( 'adoptionWorker', { name: 1 } )
				.populate( 'recruitmentWorker', { name: 1 } )
				.exec()
				.then(
					results => {
						resolve( results )
					}, 
					err => {
						// reject the promise
						reject( new Error( `error fetching children - ${ err }` ) );
					}
				);
		}
	});
}

/* map the array of children to plain objects including requested fields and matching / unmatching siblings */
exports.mapChildrenToPlainObjects = ( children, criteria, requestedFields ) => {
	let mapper = child => {
		let fields = [];
		
		// loop through all requested Child model fields and return their string representation
		for ( let field in requestedFields ) {
			let value = '';

			switch ( field ) {
				case 'status':
					value = child.status ? child.status.childStatus : '';
					break;
				case 'gender':
					value = child.gender ? child.gender.gender : '';
					break;
				case 'race':
					value = Array.isArray( child.race ) ? child.race.map( ( race ) => race.race ).join( ', ' ) : '';
					break;
				case 'familyConstellation':
					value = Array.isArray( child.recommendedFamilyConstellation ) ? child.recommendedFamilyConstellation.map( ( constellation ) => constellation.familyConstellation ).join( ', ' ) : '';
					break;
				case 'legalStatus':
					value = child.legalStatus ? child.legalStatus.legalStatus : '';
					break;
				case 'age':
					value = child.birthDate ? moment().diff( child.birthDate, 'years', false ) : '';
					break;	
				case 'siblingGroupSize':
					value = Array.isArray( child.siblingsToBePlacedWith ) ? child.siblingsToBePlacedWith.length + 1 : '';
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
				case 'socialNeeds':
					value = child.socialNeeds ? child.socialNeeds : '';
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
		
		// get siblings who match or do not match the criteria
		const [ matchedSiblings, unmatchedSiblings ] = getSiblingsMatchingStatus( child, criteria );
		
		// return the plain object
		return {
			id: child._id,
			registrationNumber: child.registrationNumber,
			name: child.name.full,
			fields: fields,
			siblingsNumber: Array.isArray( child.siblingsToBePlacedWith ) ? child.siblingsToBePlacedWith.length : 0,
			unmatchedSiblings: unmatchedSiblings,
			matchedSiblings: matchedSiblings
		}
	};
	
	return children.map( mapper );
}

/* sort an array by the number of unmatching siblings and name, children with all matching siblings are first */
exports.sortFunction = ( a, b ) => {
	return ( a.unmatchedSiblings.length > b.unmatchedSiblings.length ) ?
			1 :
			( ( b.unmatchedSiblings.length > a.unmatchedSiblings.length ) ?
				-1 :
				a.name.localeCompare( b.name )
			);
}

/* get all requested fields from the query */
exports.getFieldsFromQuery = query => {
	let fields = {};
	
	if ( Array.isArray( query.fields ) ) {
		query.fields.forEach( field => {
			fields[ field ] = true;
		});
	}
	
	return fields;
}

/* get requested fields labels to display in the report */
exports.getFieldNamesFromQuery = query => {
	return Array.isArray( query.fields ) ? query.fields.filter( ( field ) => FIELD_NAMES[ field ] ).map( ( field ) => FIELD_NAMES[ field ] ) : [];
}
	  
/* extracts minimal family data */
exports.extractFamilyData = family => {
	return {
		_id: family._id,
		displayName: family.displayName,
		registrationNumber: family.registrationNumber,
		status: family.registeredWithMARE.registered
			? family.registeredWithMARE.status
				? family.registeredWithMARE.status.familyStatus
				: 'Set Family Status'
			: 'Not Registered with MARE'
	}
}

/* return an array of all reasons why the child does not match the criteria */
function getReasonsWhyTheChildDoesNotMatchTheCriteria( child, criteria ) {
	let reasons = [];
	
	// status conflict detection (multiple)
	if ( criteria.status && !( criteria.status.$in.includes( child.status.toString() ) ) ) {
		reasons.push( "Status conflict" );
	}
	
	// gender conflict detection (multiple)
	if ( criteria.gender && !( criteria.gender.$in.includes( child.gender.toString() ) ) ) {
		reasons.push( "Gender conflict" );
	}
	
	// race conflict detection (multiple)
	if ( criteria.race && !( Array.isArray( child.race ) && child.race.map( ( objectId ) => objectId.toHexString() ).some( ( race ) => criteria.race.$in.includes( race ) ) ) ) {
		reasons.push( "Race conflict" );
	}
	
	// legal status conflict detection (multiple)
	if ( criteria.legalStatus && !( criteria.legalStatus.$in.includes( child.legalStatus.toString() ) ) ) {
		reasons.push( "Legal status conflict" );
	}
	
	// family constellation conflict detection (multiple)
	if ( criteria.recommendedFamilyConstellation && !( Array.isArray( child.recommendedFamilyConstellation ) && child.recommendedFamilyConstellation.map( ( objectId ) => objectId.toHexString() ).some( ( constellation ) => criteria.recommendedFamilyConstellation.$in.includes( constellation ) ) ) ) {
		reasons.push( "Family constellation conflict" );
	}
	
	// lower and upper ages conflicts detection
	if ( criteria.birthDate ) {
		if ( criteria.birthDate.$lte && moment(child.birthDate).isSameOrAfter( criteria.birthDate.$lte ) ) {
			reasons.push( "Lower age conflict" );
		}
		if ( criteria.birthDate.$gt && moment(child.birthDate).isBefore( criteria.birthDate.$gt ) ) {
			reasons.push( "Upper age conflict" );
		}
	}
	
	// note: assumed that siblings number conflict does not need to be checked
	
	// physical needs:
	if ( criteria.physicalNeeds && ! criteria.physicalNeeds.$in.includes( child.physicalNeeds ) ) {
		reasons.push( "Physical Needs conflict" );
	}
	
	// intellectual needs:
	if ( criteria.intellectualNeeds && ! criteria.intellectualNeeds.$in.includes( child.intellectualNeeds ) ) {
		reasons.push( "Intellectual Needs conflict" );
	}
	
	// emotional needs:
	if ( criteria.emotionalNeeds && ! criteria.emotionalNeeds.$in.includes( child.emotionalNeeds ) ) {
		reasons.push( "Emotional Needs conflict" );
	}
	
	// social needs:
	if ( criteria.socialNeeds && criteria.socialNeeds !== child.socialNeeds ) {
		reasons.push( "Social Needs conflict" );
	}
	
	// adoption worker's agency (multiple)
	if ( criteria.adoptionWorkerAgency && ! ( child.adoptionWorkerAgency && criteria.adoptionWorkerAgency.$in.includes( child.adoptionWorkerAgency.toString() ) ) ) {
		reasons.push( "Adoption Worker's Agency conflict" );
	}
	
	// recruitment worker's agency (multiple)
	if ( criteria.recruitmentWorkerAgency && ! ( child.recruitmentWorkerAgency && criteria.recruitmentWorkerAgency.$in.includes( child.recruitmentWorkerAgency.toString() ) ) ) {
		reasons.push( "Recruitment Worker's Agency conflict" );
	}
	
	// adoption worker (multiple)
	if ( criteria.adoptionWorker && ! ( child.adoptionWorker && criteria.adoptionWorker.$in.includes( child.adoptionWorker.toString() ) ) ) {
		reasons.push( "Adoption Worker conflict" );
	}
	
	// recruitment worker (multiple)
	if ( criteria.recruitmentWorker && ! ( child.recruitmentWorker && criteria.recruitmentWorker.$in.includes( child.recruitmentWorker.toString() ) ) ) {
		reasons.push( "Recruitment Worker conflict" );
	}
	
	return reasons;
}

/* get siblings who match and do not match the criteria */
function getSiblingsMatchingStatus( child, criteria ) {
	
	let unmatchedSiblings = [],
		matchedSiblings = [];
	
	child.siblingsToBePlacedWith.forEach( sibling => {
		let reasons = getReasonsWhyTheChildDoesNotMatchTheCriteria( sibling, criteria );

		if ( reasons.length > 0 ) {
			unmatchedSiblings.push( {
				id: sibling._id,
				registrationNumber: sibling.registrationNumber,
				name: sibling.name.full,
				reasons: reasons.join( ', ' )
			});
		} else {
			matchedSiblings.push( {
				id: sibling._id,
				registrationNumber: sibling.registrationNumber,
				name: sibling.name.full
			});
		}
	});
	
	return [ matchedSiblings, unmatchedSiblings ];
}