const keystone		= require( 'keystone' ),
	  userService	= require( '../components/users/user.controllers' ),
	  listService	= require( '../components/lists/list.controllers' ),
	  pageService	= require( '../components/pages/page.controllers' );

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
			const needs = [ 'none', 'mild', 'moderate', 'severe' ];
			
			// assign properties to locals for access during templating
			locals.childStatuses = childStatuses;
			locals.genders = genders;
			locals.races = races;
			locals.legalStatuses = legalStatuses;
			locals.familyConstellations = familyConstellations;
			locals.ages = Array( 21 ).fill().map( ( _, i ) => i );
			locals.siblingGroupSizes = Array( 10 ).fill().map( ( _, i ) => i );
			locals.physicalNeeds = needs;
			locals.intellectualNeeds = needs;
			locals.emotionalNeeds = needs;
			
			console.log(keystone.list('Child').model);
			console.log(keystone.list('Child').model.physicalNeeds);

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
