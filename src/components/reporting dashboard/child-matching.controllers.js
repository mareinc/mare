const keystone 			= require( 'keystone' ),
	  ObjectId 			= require( 'mongodb' ).ObjectId,
	  _					= require( 'underscore' ),
	  utilsService		= require( './utils.controllers' );
	  
const MAX_RESULTS = 10000;

/* parse query parameters and output MongoDB search criteria */
exports.getCriteria = query => {
	let criteria = {};

	// ensure criteria remains empty if the only query param is the child id
	// if criteria is modified in any way it will cause a family search, which is not the desired behavior when only a child id is passed
	if ( Object.keys( query ).length === 1 && query.childId ) {
		return criteria;
	}
	
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

	// location criteria
	if ( !query.includeOutOfStateFamilies || query.includeOutOfStateFamilies !== 'on' ) {
		criteria[ 'address.isOutsideMassachusetts' ] = false;
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
	
	// physical needs
	if ( query.physicalNeedsFrom || query.physicalNeedsTo ) {
		let physicalNeedsCriteria = utilsService.getPhysicalNeedsRange( query.physicalNeedsFrom, query.physicalNeedsTo );
		if ( physicalNeedsCriteria.length > 0 ) {
			criteria[ 'matchingPreferences.maxNeeds.physical' ] = { $in: physicalNeedsCriteria };
		}
	}
	
	// intellectual needs
	if ( query.intellectualNeedsFrom || query.intellectualNeedsTo ) {
		let intellectualNeedsCriteria = utilsService.getIntellectualNeedsRange( query.intellectualNeedsFrom, query.intellectualNeedsTo );
		if ( intellectualNeedsCriteria.length > 0 ) {
			criteria[ 'matchingPreferences.maxNeeds.intellectual' ] = { $in: intellectualNeedsCriteria };
		}
	}
	
	// emotional needs
	if ( query.emotionalNeedsFrom || query.emotionalNeedsTo ) {
		let emotionalNeedsCriteria = utilsService.getIntellectualNeedsRange( query.emotionalNeedsFrom, query.emotionalNeedsTo );
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

exports.getFamiliesByCriteria = criteria => {

	return new Promise( ( resolve, reject ) => {
		if ( _.isEmpty( criteria ) ) {
			resolve( [] );
		} else {
			keystone.list( 'Family' ).model
				.find( criteria )
				.select( '_id registrationNumber displayName contact1.name contact2.name address.isOutsideMassachusetts address.cityText' )
				.sort( { 'displayName': 'asc' } )
				.limit( MAX_RESULTS )
				.populate( 'contact1.race', { race: 1 } )
				.populate( 'contact2.race', { race: 1 } )
				.populate( 'address.city', { cityOrTown: 1 } )
				.populate( 'address.state', { abbreviation: 1 } )
				.exec()
				.then(
					results => {
						resolve( results )
					}, 
					err => {
						// reject the promise
						reject( new Error( `error fetching families - ${ err }` ) );
					}
				);
		}
	});
}

/* map the array of families to plain objects */
exports.mapFamiliesToPlainObjects = families => {

	let mapper = family => {
		return {
			id: family._id,
			registrationNumber: family.registrationNumber,
			name: family.displayName,
			contact1name: family.contact1.name.full,
			contact1race: family.contact1.race.map( ( race) => race.race ).join( ', ' ),
			contact2name: family.contact2.name.full,
			contact2race: family.contact2.race.map( ( race) => race.race ).join( ', ' ),
			city: !family.address.isOutsideMassachusetts && family.address.city ? family.address.city.cityOrTown : family.address.cityText,
			state: family.address.state ? family.address.state.abbreviation : ''
		}
	};
	
	return families.map( mapper );
}

/* sort families plain objects by name property */
exports.sortFunction = ( a, b ) => {
	return a.name.localeCompare( b.name );
}

/* Extracts minimal child data */
exports.extractChildData = child => {
	return {
		_id: child._id,
		displayNameAndRegistration: child.displayNameAndRegistration
	}
}