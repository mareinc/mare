const keystone 		= require( 'keystone' ),
	  ObjectId 		= require( 'mongodb' ).ObjectId,
	  _				= require( 'underscore' ),
	  moment		= require( 'moment' ),
	  utilsService	= require( './utils.controllers' );

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
const MAX_RESULTS = 100;

exports.getValidCriteria = ( query ) => {
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
	
	// physical needs:
	if ( query.physicalNeedsFrom || query.physicalNeedsTo ) {
		let physicalNeedsCriteria = utilsService.getPhysicalNeedsRange( query.physicalNeedsFrom, query.physicalNeedsTo );
		if ( physicalNeedsCriteria.length > 0 ) {
			criteria[ 'physicalNeeds' ] = { $in: physicalNeedsCriteria };
		}
	}
	
	// intellectual needs:
	if ( query.intellectualNeedsFrom || query.intellectualNeedsTo ) {
		let intellectualNeedsCriteria = utilsService.getIntellectualNeedsRange( query.intellectualNeedsFrom, query.intellectualNeedsTo );
		if ( intellectualNeedsCriteria.length > 0 ) {
			criteria[ 'intellectualNeeds' ] = { $in: intellectualNeedsCriteria };
		}
	}
	
	// emotional needs:
	if ( query.emotionalNeedsFrom || query.emotionalNeedsTo ) {
		let emotionalNeedsCriteria = utilsService.getIntellectualNeedsRange( query.emotionalNeedsFrom, query.emotionalNeedsTo );
		if ( emotionalNeedsCriteria.length > 0 ) {
			criteria[ 'emotionalNeeds' ] = { $in: emotionalNeedsCriteria };
		}
	}
	
	// social needs:
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

function getReasonsIfUnmatchingChild( child, criteria ) {
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

exports.getResultsPromise = ( criteria ) => {
	if ( ! _.isEmpty( criteria ) ) {
		return new Promise( ( resolve, reject ) => {
			keystone.list( 'Child' ).model
				.find( criteria )
				.sort( { 'name.full' : 'asc' } )
				.limit( MAX_RESULTS )
				.populate( 'status' )
				.populate( 'gender' )
				.populate( 'race' )
				.populate( 'legalStatus' )
				.populate( 'recommendedFamilyConstellation' )
				.populate( 'siblings' )
				.populate( 'siblingsToBePlacedWith' )
				.populate( 'adoptionWorkerAgency' )
				.populate( 'recruitmentWorkerAgency' )
				.populate( 'adoptionWorker' )
				.populate( 'recruitmentWorker' )
				.exec()
				.then(
					results => resolve( results ), 
					err => {
						// reject the promise
						reject( new Error( `error fetching children - ${ err }` ) );
					}
				);
		});
	} else {
		return [];
	}
}

function getUnmatchedSiblings( child, criteria ) {
	let unmatchedSiblings = [];
	let matchedSiblings = [];
	
	child.siblingsToBePlacedWith.forEach( ( sibling ) => {
		let reasons = getReasonsIfUnmatchingChild( sibling, criteria );
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

exports.processResults = ( results, criteria, includeFields ) => {
	let mapper = ( child ) => {
		let fields = [];
		
		for ( let field in includeFields ) {
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
		
		const [ matchedSiblings, unmatchedSiblings ] = getUnmatchedSiblings( child, criteria );
		
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
	
	return results.map( mapper );
}

exports.sortResults = ( results ) => {
	return results.sort( ( a, b ) => ( a.unmatchedSiblings.length > b.unmatchedSiblings.length ) ? 1 : ( ( b.unmatchedSiblings.length > a.unmatchedSiblings.length ) ? -1 : a.name.localeCompare( b.name ) ) );
}

exports.getFieldsFromQuery = ( query ) => {
	let fields = {};
	
	if ( Array.isArray( query.fields ) ) {
		query.fields.forEach( ( field ) => {
			fields[ field ] = true;
		});
	}
	
	return fields;
}

exports.getReportFieldNamesFromQuery = ( query ) => {
	return Array.isArray( query.fields ) ? query.fields.filter( ( field ) => FIELD_NAMES[ field ] ).map( ( field ) => FIELD_NAMES[ field ] ) : [];
}

exports.sendPDF = ( req, res, results ) => {
	const view	= new keystone.View( req, res ),
		  locals	= res.locals;

	locals.results = results;
	
	// render HTML table and convert to PDF using Puppeteer (Chrome under the hood)
	view.render( 'tools-family-matching-pdf', { layout: null }, function( error, html ) {
		const convertHTMLToPDF = require( "pdf-puppeteer" );
		const callback = ( pdf ) => {
			res.setHeader( "Content-Type", "application/pdf" );
			res.send( pdf );
		};
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
			headerTemplate: '<span style="font-size: 18px; margin-left: 45px;">Massachusetts Adoption Resource Exchange, Inc.<br><span style="font-size: 16px;">Family Match Criteria Listing</span></span>',	
			footerTemplate : '<span class="pageNumber" style="font-size: 10px; margin-left: 45px; text-align: center;"></span><span class="date" style="font-size: 10px; margin-left: 45px; text-align: right"></span>'
		};
		
		convertHTMLToPDF( utilsService.unescapeHTML( html ), callback, pageOptions, {
			executablePath: process.env.CHROME_PATH,
			args: [ '--no-sandbox' ]
		});
	});
}
	  
/* Extracts minimal family data */
exports.extractFamilyData = ( family ) => {
	return {
		_id: family._id,
		displayName: family.displayName,
		registrationNumber: family.registrationNumber
	}
}