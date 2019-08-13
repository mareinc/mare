const keystone			= require( 'keystone' ),
	  utilityService 	= require( '../../utils/utility.controllers' );

exports.PHYSICAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.INTELLECTUAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.EMOTIONAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.SOCIAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];

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
			id: agency._id,
			name: agency.name
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