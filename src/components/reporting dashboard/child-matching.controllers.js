const keystone 		= require( 'keystone' ),
	  ObjectId 		= require('mongodb').ObjectId,
	  _				= require( 'underscore' ),
	  utilsService	= require( './utils.controllers' );
	  
const MAX_RESULTS = 100;

exports.getValidCriteria = ( query ) => {
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
		let physicalNeedsCriteria = utilsService.getPhysicalNeedsRange( query.physicalNeedsFrom, query.physicalNeedsTo );
		if ( physicalNeedsCriteria.length > 0 ) {
			criteria[ 'matchingPreferences.maxNeeds.physical' ] = { $in: physicalNeedsCriteria };
		}
	}
	
	// intellectual needs:
	if ( query.intellectualNeedsFrom || query.intellectualNeedsTo ) {
		let intellectualNeedsCriteria = utilsService.getIntellectualNeedsRange( query.intellectualNeedsFrom, query.intellectualNeedsTo );
		if ( intellectualNeedsCriteria.length > 0 ) {
			criteria[ 'matchingPreferences.maxNeeds.intellectual' ] = { $in: intellectualNeedsCriteria };
		}
	}
	
	// emotional needs:
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

exports.getResultsPromise = ( criteria ) => {
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

exports.processResults = ( results, criteria, includeFields ) => {
	let mapper = ( family ) => {
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
			state: family.address.state ? family.address.state.abbreviation : ''
		}
	};
	
	return results.map( mapper );
}

exports.sortResults = ( results ) => {
	return results.sort( ( a, b ) => a.name.localeCompare( b.name ) );
}

exports.sendPDF = ( req, res, results ) => {
	const view	= new keystone.View( req, res ),
		  locals	= res.locals;

	locals.results = results;
	
	// render HTML table and convert to PDF using Puppeteer (Chrome under the hood)
	view.render( 'tools-child-matching-pdf', { layout: null }, function( error, html ) {
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
			headerTemplate: '<span style="font-size: 18px; margin-left: 45px;">Massachusetts Adoption Resource Exchange, Inc.<br><span style="font-size: 16px;">Child Match Criteria Listing</span></span>',	
			footerTemplate : '<span class="pageNumber" style="font-size: 10px; margin-left: 45px; text-align: center;"></span><span class="date" style="font-size: 10px; margin-left: 45px; text-align: right"></span>'
		};
		
		convertHTMLToPDF( exports.unescapeHTML( html ), callback, pageOptions, {
			executablePath: process.env.CHROME_PATH
		});
	});
}

exports.unescapeHTML = (str) => {
	const htmlEntities = {
		nbsp: ' ',
		cent: '¢',
		pound: '£',
		yen: '¥',
		euro: '€',
		copy: '©',
		reg: '®',
		lt: '<',
		gt: '>',
		quot: '"',
		amp: '&',
		apos: '\''
	};

	return str.replace(/\&([^;]+);/g, function (entity, entityCode) {
		var match;

		if (entityCode in htmlEntities) {
			return htmlEntities[entityCode];
			/*eslint no-cond-assign: 0*/
		} else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
			return String.fromCharCode(parseInt(match[1], 16));
			/*eslint no-cond-assign: 0*/
		} else if (match = entityCode.match(/^#(\d+)$/)) {
			return String.fromCharCode(~~match[1]);
		} else {
			return entity;
		}
	});
};

exports.extractSocialWorkersData = ( socialWorkers ) => {
	return socialWorkers.map( ( socialWorker ) => {
		return {
			id: socialWorker._id,
			name: socialWorker.name
		}
	});
}

exports.extractAgenicesData = ( agencies ) => {
	return agencies.map( ( agency ) => {
		return {
			id: agency._id,
			name: agency.name
		}
	});
}

exports.extractChildData = ( child ) => {
	return {
		_id: child._id,
		displayNameAndRegistration: child.displayNameAndRegistration
	}
}