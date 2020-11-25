const keystone			= require( 'keystone' ),
	  moment			= require( 'moment' ),
	  utilityService 	= require( '../../utils/utility.controllers' );

exports.PHYSICAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.INTELLECTUAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.EMOTIONAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.SOCIAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.INQUIRER_OPTIONS = [ 'site visitor', 'family', 'social worker' ];
exports.INQUIRY_TYPES = [ 'child inquiry', 'complaint', 'family support consultation', 'general inquiry', 'other point of engagement' ];
exports.PLACEMENT_TYPES = [ 'Placement', 'Match', 'Legalization', 'Disruption' ];
exports.PLACEMENT_TYPES_TO_DATABASE_LOCATION_DICTIONARY = {
	Placement: 'placements',
	Match: 'matches',
	Disruption: 'disruptions',
	Legalization: 'legalizations'
};

// family stages are defined in an intentional, chronological, order - changing the order of the items 
// in this list will impact the behavior of the family listing report (and potentially others)
exports.FAMILY_STAGES = [{
	label: 'gathering information',
	path: 'stages.gatheringInformation.started',
	datePath: 'stages.gatheringInformation.date'
 }, {
	label: 'looking for agency',
	path: 'stages.lookingForAgency.started',
	datePath: 'stages.lookingForAgency.date'
 }, {
	label: 'working with agency',
	path: 'stages.workingWithAgency.started',
	datePath: 'stages.workingWithAgency.date'
 }, {
	label: 'MAPP training completed',
	path: 'stages.MAPPTrainingCompleted.completed',
	datePath: 'stages.MAPPTrainingCompleted.date'
 }, {
	 label: 'homestudy completed',
	 path: 'homestudy.completed',
	 datePath: 'homestudy.initialDate'
 }, {
	label: 'registered with MARE',
	path: 'registeredWithMARE.registered',
	datePath: 'registeredWithMARE.date'
 }, {
	 label: 'closed',
	 path: 'closed.isClosed',
	 datePath: 'closed.date'
 }];

exports.FAMILY_SERVICES = [{
	label: 'mentee',
	path: 'familyServices.mentee'
 }, {
	label: 'mentor',
	path: 'familyServices.mentor'
 }, {
	label: 'media spokesperson',
	path: 'familyServices.mediaSpokesperson'
}, {
	label: 'event presenter/spokesperson',
	path: 'familyServices.eventPresenterOrSpokesperson'
 }, {
	label: 'community outreach',
	path: 'familyServices.communityOutreach'
}, {
	label: 'fundraising',
	path: 'familyServices.fundraising'
 }, {
	label: 'MARE support group leader',
	path: 'familyServices.MARESupportGroupLeader'
}, {
	label: 'MARE support group participant',
	path: 'familyServices.MARESupportGroupParticipant'
}, {
	label: 'receives consultation services',
	path: 'familyServices.receivesConsultationServices'
}];

exports.getPhysicalNeedsRange = ( fromNeed, toNeed ) => {
	return utilityService.arrayCut( exports.PHYSICAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getIntellectualNeedsRange = ( fromNeed, toNeed ) => {
	return utilityService.arrayCut( exports.INTELLECTUAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getEmotionalNeedsRange = ( fromNeed, toNeed ) => {
	return utilityService.arrayCut( exports.EMOTIONAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getSocialNeedsRange = ( fromNeed, toNeed ) => {
	return utilityService.arrayCut( exports.SOCIAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.generateNumericCriteriaRange = ( rangeMin, rangeMax ) => {
	let numericRange = [];

	for ( let num = rangeMin; num <= rangeMax; num++ ) {
		numericRange.push( num );
	}

	return numericRange;
};

/* map social workers array to the array of simple objects */
exports.extractSocialWorkersData = socialWorkers => {
	return socialWorkers.map( socialWorker => {
		return {
			id: socialWorker._id,
			name: socialWorker.name
		}
	});
}

/* map agencies array to the array of simple objects */
exports.extractAgenicesData = agencies => {
	return agencies.map( agency => {
		return {
			id: agency._id.toString(),
			text: `${agency.code} (${agency.name})`
		}
	});
}

/* 
	create an array of plain JS objects to serve as <select> options and determine which options should be selected
	options represent Other Consideration documents
*/
exports.extractOtherConsiderationsData = ( otherConsiderationsDocs, selectedOtherConsiderations = [] ) => {
	return otherConsiderationsDocs.map( otherConsideration => {
		return {
			id: otherConsideration._id,
			name: otherConsideration.otherConsideration,
			selected: selectedOtherConsiderations.includes( otherConsideration._id.toString() ) 
		}
	});
};

/* 
	create an array of plain JS objects to serve as <select> options and determine which options should be selected
	options represent Disability documents
*/
exports.extractDisabilitiesData = ( disabilityDocs, selectedDisability = [] ) => {
	return disabilityDocs.map( disability => {
		return {
			id: disability._id,
			name: disability.disability,
			selected: selectedDisability.includes( disability._id.toString() ) 
		}
	});
};



exports.getFamilyStagesData = familyDoc => {

	return exports.FAMILY_STAGES.map( familyStage => {

		const label = familyStage.label;
		const isComplete = _getProperty( familyStage.path, familyDoc );
		const dateComplete =  _getProperty( familyStage.datePath, familyDoc );
		const formattedDateComplete = dateComplete ? moment.utc( dateComplete ).format( 'MM/DD/YYYY' ) : 'date not specified';
		
		return {
			label,
			value: isComplete,
			date: formattedDateComplete,
			websiteDisplay: `${label} (${formattedDateComplete})`,
			excelDisplay: isComplete ? formattedDateComplete : 'not started'
		};
	});
};

exports.getCurrentFamilyStage = familyDoc => {

	// starting from the last stage (chronoligically), find the first stage that is complete
	return exports.getFamilyStagesData( familyDoc ).reverse().find( stage => stage.value );
};

exports.getFamilyServices = familyDoc => {

	if ( familyDoc.familyServices ) {
		return this.FAMILY_SERVICES.reduce( ( offeredServices, service ) => {

			const doesFamilyOfferService = _getProperty( service.path, familyDoc );
			
			if ( doesFamilyOfferService ) {
				offeredServices.push( service.label );
			}
	
			return offeredServices;
		}, []).join( ', ' );
	} else {
		return [];
	}
};

/* fetch an array of models, map them and send them in jQuery Select2 format */
exports.fetchModelsMapAndSendResults = ( fetchPromise, mapFunction, res ) => {
	
	// fetch models, map them and send
	fetchPromise.then( models => {
		res.send( {
			results: models.map( mapFunction ),
			pagination: {
				more: false
			} 
		});
	})
	.catch( err => {
		console.error( `error while loading models`, err );

		// send empty result
		res.send( {
			results: [], 
			pagination: {
				more: false
			}
		});
	});
}

/* render data using htmlViewTemplate template file, convert the HTML output to PDF using Puppeteer and send it */
exports.sendPDF = ( req, res, data, htmlViewTemplate, { headerTitle } ) => {
	const view = new keystone.View( req, res );
	
	// merge res.locals with the data
	res.locals = {
		...res.locals,
		...data
	}
	
	// render HTML and convert to PDF using Puppeteer (Chrome under the hood)
	view.render( htmlViewTemplate, { layout: null }, function( error, html ) {
		const convertHTMLToPDF = require( "pdf-puppeteer" );
		const callback = pdf => {
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
			headerTemplate: `<span style="font-size: 18px; margin-left: 45px;">Massachusetts Adoption Resource Exchange, Inc.<br><span style="font-size: 16px;">${ headerTitle }</span></span>`,	
			footerTemplate : '<span class="pageNumber" style="font-size: 10px; margin-left: 45px; text-align: center;"></span><span class="date" style="font-size: 10px; margin-left: 45px; text-align: right"></span>'
		};
		
		convertHTMLToPDF( utilityService.unescapeHTML( html ), callback, pageOptions, {
			executablePath: process.env.CHROME_PATH,
			args: [ '--no-sandbox' ]
		});
	});
}

// helper to access nested properties on mongooose docs using array syntax
function _getProperty( propertyName, object ) {
	var parts = propertyName.split( "." ),
	  length = parts.length,
	  i,
	  property = object || this;
  
	for ( i = 0; i < length; i++ ) {
	  property = property[parts[i]];
	}
  
	return property;
}