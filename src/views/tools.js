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
		fetchRegions = listService.getAllRegions(),
		fetchResidences = listService.getAllResidences();

	Promise.all( [ fetchChildStatuses, fetchGenders, fetchRaces, fetchLegalStatuses, fetchFamilyConstellations, fetchInquiryMethods, fetchRegions, fetchResidences ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ childStatuses, genders, races, legalStatuses, familyConstellations, inquiryMethods, regions, residences ] = values;
			
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
			locals.inquiryTypes = utilsService.INQUIRY_TYPES;
			locals.placementTypes = utilsService.PLACEMENT_TYPES;
			locals.inquiryMethods = inquiryMethods;
			locals.regions = regions;
			locals.residences = residences;
			// create a range from 30 days ago to today
			locals.defaultDateRange = {
				fromDate: moment().subtract( 30, "days" ).format( 'YYYY-MM-DD' ),
				toDate: moment().format( 'YYYY-MM-DD' )
			};
			// generate the date ranges of the previous three fiscal years to support pre-filling search dates by fiscal year
			// on the inquiry report search form
			const PREVIOUS_YEARS = 3;
			const CURRENT_YEAR = moment.utc().year();
			const IS_PAST_FISCAL_YEAR_END = moment.utc().dayOfYear() > moment.utc('06/30', 'MM/DD').dayOfYear();
			let fiscalYears = [];
			for ( let i = 0; i < PREVIOUS_YEARS; i++ ) {
				fiscalYears.push({
					startDate: moment.utc(`07/01/${CURRENT_YEAR - (IS_PAST_FISCAL_YEAR_END ? i + 1 : i + 2)}`, 'MM/DD/YYYY').format( 'YYYY-MM-DD' ),
					endDate: moment.utc(`06/30/${CURRENT_YEAR - (IS_PAST_FISCAL_YEAR_END ? i : i + 1)}`, 'MM/DD/YYYY').format( 'YYYY-MM-DD' ),
					fiscalYear: moment.utc().year() - (IS_PAST_FISCAL_YEAR_END ? i : i + 1)
				});
			}
			locals.fiscalYears = fiscalYears.reverse();

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
