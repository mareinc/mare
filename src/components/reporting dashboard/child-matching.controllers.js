const keystone 			= require( 'keystone' ),
	  ObjectId 			= require( 'mongodb' ).ObjectId,
	  _					= require( 'underscore' ),
	  utilsService		= require( './utils.controllers' ),
	  globalUtils 		= require( '../../utils/utility.controllers' );
	  
const MAX_RESULTS = 10000;

/* parse query parameters and output MongoDB search criteria */
exports.getCriteria = query => {
	let criteria = {};

	// a mongoose find() query can only have one top-level $or condition, so we store all $or criteria in this array and
	// wrap them in an $and if necessary, which we can determine once all criteria have been set
	let orCriteria = [];

	// ensure criteria remains empty if the only query param is the child id
	// if criteria is modified in any way it will cause a family search, which is not the desired behavior when only a child id is passed
	if ( Object.keys( query ).length === 1 && query.childId ) {
		return criteria;
	}

	// status criteria (multiple)
	criteria[ 'registeredWithMARE.registered' ] = true;
	criteria[ 'isActive' ] = true;
	
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
		orCriteria.push([
			{ 'address.isOutsideMassachusetts': false }, // if the record exists in the database and is set to false 
			{ 'address.isOutsideMassachusetts': { $exists: false } }, // if the record doesn't exist at all in the database we can assume it's false
			{ 'address.isOutsideMassachusetts': { $type: 10 } } // catch-all in case the record exists but the value is somehow set to null ( not 100% sure we need this )
		]);
	}

	// age range criteria
	let isMinimumAgeSpecified = !isNaN( parseInt( query.agesFrom ) );
	let isMaximumAgeSpecified = !isNaN( parseInt( query.agesTo ) ); 
	if ( isMinimumAgeSpecified || isMaximumAgeSpecified ) {
		let preferredAgeRange = utilsService.generatePreferredAgeRange(
			isMinimumAgeSpecified ? parseInt( query.agesFrom ) : 0,
			isMaximumAgeSpecified ? parseInt( query.agesTo ) : 20
		);
		orCriteria.push([
			{ $or: [
				{ 'matchingPreferences.adoptionAges.from': { $in: preferredAgeRange } },
				{ $and: [
					{ 'matchingPreferences.adoptionAges.from': { $type: 10 } },
					{ 'matchingPreferences.adoptionAges.to': { $gt: preferredAgeRange[ preferredAgeRange.length - 1 ] } }
				]}
			]},
			{ $or: [
				{ 'matchingPreferences.adoptionAges.to': { $in: preferredAgeRange } },
				{ $and: [
					{ 'matchingPreferences.adoptionAges.to': { $type: 10 } },
					{ 'matchingPreferences.adoptionAges.from': { $lt: preferredAgeRange[ 0 ] } }
				]}
			]}
		]);
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

	// other considerations criteria (multiple)
	if ( Array.isArray( query.otherConsiderations ) && query.otherConsiderations.length > 0 ) {
		let filtered = query.otherConsiderations.filter( objectId => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'matchingPreferences.otherConsiderations' ] = { $in: filtered };
		}
	}

	// disabilities criteria (multiple)
	if ( Array.isArray( query.disabilities ) && query.disabilities.length > 0 ) {
		let filtered = query.disabilities.filter( objectId => ObjectId.isValid( objectId ) );
		if ( filtered.length > 0 ) {
			criteria[ 'matchingPreferences.disabilities' ] = { $in: filtered };
		}
	}

	// append $or criteria
	if ( orCriteria.length === 1 ) {
		criteria[ '$or' ] = orCriteria[ 0 ];
	} else if ( orCriteria.length > 1 ) {
		criteria[ '$and' ] = orCriteria.map( criterion => ( { $or: criterion } ) );
	}
	
	return criteria;
}

exports.getFamiliesByCriteria = criteria => {

	const fieldsToSelectFromFamilyModel = [ '_id', 'registrationNumber', 'displayName', 'contact1.name', 'contact2.name', 'address.isOutsideMassachusetts',
	'address.cityText', 'numberOfChildren', 'matchingPreferences.minNumberOfChildrenToAdopt', 'matchingPreferences.maxNumberOfChildrenToAdopt',
	'matchingPreferences.adoptionAges.from', 'matchingPreferences.adoptionAges.to' ];

	return new Promise( ( resolve, reject ) => {
		if ( _.isEmpty( criteria ) ) {
			resolve( [] );
		} else {
			keystone.list( 'Family' ).model
				.find( criteria )
				.select( fieldsToSelectFromFamilyModel.join( ' ' ) )
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
			contact1race: family.contact1.race.map( race => race.race ).join( ', ' ),
			contact2name: family.contact2.name.full,
			contact2race: family.contact2.race.map( race => race.race ).join( ', ' ),
			currentNumberOfChildren: family.numberOfChildren ? family.numberOfChildren : 'Unspecified',
			minNumberOfChildren: !globalUtils.isNil(family.matchingPreferences.minNumberOfChildrenToAdopt) ? family.matchingPreferences.minNumberOfChildrenToAdopt : 'Unspecified',
			maxNumberOfChildren: !globalUtils.isNil(family.matchingPreferences.maxNumberOfChildrenToAdopt) ? family.matchingPreferences.maxNumberOfChildrenToAdopt : 'Unspecified',
			minPreferredAge: !globalUtils.isNil(family.matchingPreferences.adoptionAges.from) ? family.matchingPreferences.adoptionAges.from : 'Unspecified',
			maxPreferredAge: !globalUtils.isNil(family.matchingPreferences.adoptionAges.to) ? family.matchingPreferences.adoptionAges.to : 'Unspecified',
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
		displayNameAndRegistration: child.displayNameAndRegistration,
		status: child.status.childStatus
	}
}