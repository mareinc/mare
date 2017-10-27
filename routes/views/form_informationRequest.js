const keystone		= require( 'keystone' ),
	  listsService	= require( '../middleware/service_lists' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 				= new keystone.View( req, res ),
		  locals 			= res.locals;
	
	// objects with additional search parameters
	const stateOptions		= { default: 'Massachusetts' },
		  raceOptions		= { other: true },
		  waysToHearOptions	= { other: true };
	
	// fetch all data needed to render this page
	let fetchCitiesAndTowns			= listsService.getAllCitiesAndTowns(),
		fetchGenders				= listsService.getAllGenders(),
		fetchRaces					= listsService.getAllRaces( raceOptions ),
		fetchStates					= listsService.getAllStates( stateOptions ),
		fetchWaysToHearAboutMARE	= listsService.getAllWaysToHearAboutMARE( waysToHearOptions ),
		fetchSidebarItems			= pageService.getSidebarItems();

	Promise.all( [ fetchCitiesAndTowns, fetchGenders, fetchRaces, fetchStates, fetchWaysToHearAboutMARE,
				   fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ citiesAndTowns, genders, races, states, waysToHearAboutMARE, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			
			// assign properties to locals for access during templating
			locals.citiesAndTowns		= citiesAndTowns;
			locals.genders				= genders;
			locals.races				= races;
			locals.states				= states;
			locals.waysToHearAboutMARE	= waysToHearAboutMARE;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the form_information-request.hbs template
			view.render( 'form_information-request' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the information request form - ${ err }` );
			// Set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the form_information-request.hbs template
			view.render( 'form_information-request' );
		});
};
