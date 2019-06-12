const keystone		= require( 'keystone' ),
	  listsService	= require( '../../components/lists/list.controllers' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 				= new keystone.View( req, res ),
		  locals 			= res.locals;
	
	// objects with additional search parameters
	const raceOptions		= { other: true },
		  stateOptions		= { default: 'Massachusetts' };
	
	// fetch all data needed to render this page
	let fetchCitiesAndTowns							= listsService.getAllCitiesAndTowns(),
		fetchDisabilities							= listsService.getAllDisabilities(),
		fetchFamilyConstellations					= listsService.getAllFamilyConstellations(),
		fetchGenders								= listsService.getAllGenders(),
		fetchLanguages								= listsService.getAllLanguages(),
		fetchLegalStatuses							= listsService.getAllLegalStatuses(),
		fetchOtherFamilyConstellationConsiderations	= listsService.getAllOtherFamilyConstellationConsiderations(),
		fetchRaces									= listsService.getAllRaces( raceOptions ),
		fetchResidences								= listsService.getAllResidences(),
		fetchStates									= listsService.getAllStates( stateOptions ),
		fetchSidebarItems							= pageService.getSidebarItems();

	Promise.all( [ fetchCitiesAndTowns, fetchDisabilities, fetchFamilyConstellations, fetchGenders, fetchLanguages,
				   fetchLegalStatuses, fetchOtherFamilyConstellationConsiderations,
				   fetchRaces, fetchResidences, fetchStates, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ citiesAndTowns, disabilities, familyConstellations, genders, languages,
					legalStatuses, otherFamilyConstellationConsiderations,
					races, residences, states, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			
			// add 'default' value
			let familyConstellationsAltered = [];
			familyConstellations.forEach( ( familyConstellation, i ) => {
				familyConstellation.set( 'default', familyConstellation.key !== 'unknown' && familyConstellation.key !== 'other', { strict: false } );
				familyConstellationsAltered.push( familyConstellation.toObject() );
			} );
			
			// assign properties to locals for access during templating
			locals.citiesAndTowns							= citiesAndTowns;
			locals.disabilities								= disabilities;
			locals.familyConstellations						= familyConstellationsAltered;
			locals.genders									= genders;
			locals.languages								= languages;
			locals.legalStatuses							= legalStatuses;
			locals.otherFamilyConstellationConsiderations	= otherFamilyConstellationConsiderations;
			locals.races									= races;
			locals.residences								= residences;
			locals.states									= states;
			locals.randomSuccessStory						= randomSuccessStory;
			locals.randomEvent								= randomEvent;
			
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the form_social-worker-child-registration.hbs template
			view.render( 'form_social-worker-child-registration' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the social worker child registration form`, err );
			// render the view using the form_social-worker-child-registration.hbs template
			view.render( 'form_social-worker-child-registration' );
		});
};