const keystone		= require( 'keystone' ),
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
		fetchFamilyConstellations = listService.getAllFamilyConstellations();

	Promise.all( [ fetchChildStatuses, fetchGenders, fetchRaces, fetchLegalStatuses, fetchFamilyConstellations ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ childStatuses, genders, races, legalStatuses, familyConstellations ] = values;
			
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
