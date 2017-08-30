const keystone		= require( 'keystone' ),
	  listsService	= require( '../middleware/service_lists' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 				= new keystone.View( req, res ),
		  locals 			= res.locals;

	// objects with additional search parameters
	const stateOptions		= { default: 'Massachusetts' },
		  raceOptions		= { other: true };

	// fetch all data needed to render this page
	let fetchCitiesAndTowns			= listsService.getAllCitiesAndTowns(),
		fetchDisabilities			= listsService.getAllDisabilities(),
		fetchGenders				= listsService.getAllGenders(),
		fetchLanguages				= listsService.getAllLanguages(),
		fetchLegalStatuses			= listsService.getAllLegalStatuses(),
		fetchOtherConsiderations	= listsService.getAllOtherConsiderations(),
		fetchRaces					= listsService.getAllRaces( raceOptions ),
		fetchStates					= listsService.getAllStates( stateOptions ),
		fetchChildTypes				= listsService.getChildTypesForWebsite(),
		fetchSidebarItems			= pageService.getSidebarItems();
	
		Promise.all( [ fetchCitiesAndTowns, fetchDisabilities, fetchGenders, fetchLanguages, fetchLegalStatuses,
					   fetchOtherConsiderations, fetchRaces, fetchStates, fetchChildTypes, fetchSidebarItems ] )
			.then( values => {
				// assign local variables to the values returned by the promises
				const [ citiesAndTowns, disabilities, genders, languages, legalStatuses,
						otherConsiderations, races, states, childTypes, sidebarItems ] = values;
				// the sidebar items are a success story and event in an array, assign local variables to the two objects
				const [ randomSuccessStory, randomEvent ] = sidebarItems;
				
				// assign properties to locals for access during templating
				locals.citiesAndTowns		= citiesAndTowns;
				locals.disabilities			= disabilities;
				locals.genders				= genders;
				locals.languages			= languages;
				locals.legalStatuses		= legalStatuses;
				locals.otherConsiderations	= otherConsiderations;
				locals.races				= races;
				locals.states				= states;
				locals.childTypes			= childTypes;
				locals.randomSuccessStory	= randomSuccessStory;
				locals.randomEvent			= randomEvent;

				// set the layout to render with the right sidebar
				locals[ 'render-with-sidebar' ] = true;
				// render the view using the form_social-worker-family-registration.hbs template
				view.render( 'form_social-worker-family-registration' );
			})
			.catch( err => {
				// log an error for debugging purposes
				console.error( `there was an error loading data for the social worker family registration form - ${ err }` );
				// set the layout to render with the right sidebar
				locals[ 'render-with-sidebar' ] = true;
				// render the view using the form_social-worker-family-registration.hbs template
				view.render( 'form_social-worker-family-registration' );
			});
};
