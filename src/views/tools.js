const keystone		= require( 'keystone' ),
	  moment		= require( 'moment' ),
	  listService	= require( '../components/lists/list.controllers' );
	  utilsService	= require( '../components/reporting dashboard/utils.controllers' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals;
	
	let fetchChildStatuses = listService.getAllChildStatuses(),
		fetchGenders = listService.getAllGenders(),
		fetchRaces = listService.getAllRaces(),
		fetchLegalStatuses = listService.getAllLegalStatuses(),
		fetchFamilyConstellations = listService.getAllFamilyConstellations(),
		fetchInquiryMethods = listService.getAllInquiryMethods(),
		fetchInquiryTypes = listService.getAllInquiryTypes();

	Promise.all( [ fetchChildStatuses, fetchGenders, fetchRaces, fetchLegalStatuses, fetchFamilyConstellations, fetchInquiryMethods, fetchInquiryTypes ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ childStatuses, genders, races, legalStatuses, familyConstellations, inquiryMethods, inquiryTypes ] = values;
			
			// assign properties to locals for access during templating
			locals.childStatuses = childStatuses;
			locals.genders = genders;
			locals.races = races;
			locals.legalStatuses = legalStatuses;
			locals.familyConstellations = familyConstellations;
			locals.ages = Array( 21 ).fill().map( ( _, i ) => i );
			locals.siblingGroupSizes = Array.from( { length: 10 }, ( value, index ) => ++index );
			locals.physicalNeeds = utilsService.PHYSICAL_NEEDS_OPTIONS;
			locals.intellectualNeeds = utilsService.INTELLECTUAL_NEEDS_OPTIONS;
			locals.emotionalNeeds = utilsService.EMOTIONAL_NEEDS_OPTIONS;
			locals.socialNeeds = utilsService.SOCIAL_NEEDS_OPTIONS;
			locals.inquirers = utilsService.INQUIRER_OPTIONS;
			locals.inquiryMethods = inquiryMethods;
			locals.inquiryTypes = inquiryTypes;
			// create a range from 30 days ago to today
			locals.defaultInquiryDateRange = {
				fromDate: moment().subtract( 30, "days" ).format( 'YYYY-MM-DD' ),
				toDate: moment().format( 'YYYY-MM-DD' )
			};

			// render the view using the tools.hbs template
			view.render( 'tools', { layout: 'tools' } );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the tools page`, err );
			// render the view using the tools.hbs template
			view.render( 'tools', { layout: 'tools' } );
		});
};
