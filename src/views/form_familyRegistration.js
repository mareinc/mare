const keystone						= require( 'keystone' ),
	  listService					= require( '../components/lists/list.controllers' ),
	  pageService					= require( '../components/pages/page.controllers' ),
	  staffEmailContactMiddleware	= require( '../components/staff email contacts/staff-email-contact.controllers' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 				= new keystone.View( req, res ),
		  locals 			= res.locals;

	// set default information for a staff email contact in case the real contact info can't be fetched
	locals.socialWorkerFamilyRegistrationQuestionContact = {
		name: { full: 'MARE' },
		email: 'web@mareinc.org'
	};

	// objects with additional search parameters
	const stateOptions		= { default: 'Massachusetts' },
		  raceOptions		= { other: true };

	// fetch all data needed to render this page
	let fetchCitiesAndTowns			= listService.getAllCitiesAndTowns(),
		fetchGenders				= listService.getAllGenders(),
		fetchLanguages				= listService.getAllLanguages(),
		fetchLegalStatuses			= listService.getAllLegalStatuses(),
		fetchRaces					= listService.getAllRaces( raceOptions ),
		fetchStates					= listService.getAllStates( stateOptions ),
		fetchChildTypes				= listService.getChildTypesForWebsite();
	
	// initialize a promise chain
	Promise.resolve()
		// fetch information to populate all form selection elements
		.then( () => Promise.all( [ fetchCitiesAndTowns, fetchGenders, fetchLanguages, fetchLegalStatuses, fetchRaces, fetchStates, fetchChildTypes ] ) )
		// assign returned form selection element data to locals for templating
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ citiesAndTowns, genders, languages, legalStatuses, races, states, childTypes ] = values;
			
			// assign properties to locals for access during templating
			locals.citiesAndTowns		= citiesAndTowns;
			locals.genders				= genders;
			locals.languages			= languages;
			locals.legalStatuses		= legalStatuses;
			locals.races				= races;
			locals.states				= states;
			locals.childTypes			= childTypes;
		})
		// if there was an error fetching form selection element data
		.catch( err => console.err( `error fetching data to populate social worker family registration form selection elements`, err ) )
		// fetch the email target model matching 'social worker family registration question'
		.then( () => listService.getEmailTargetByName( 'social worker family registration question' ) )
		// fetch contact info for the staff contact for 'social worker family registration question'
		.then( emailTarget => staffEmailContactMiddleware.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
		// overwrite the default contact details with the returned object
		.then( staffEmailContact => locals.socialWorkerFamilyRegistrationQuestionContact = staffEmailContact.staffEmailContact )
		// log any errors fetching the staff email contact
		.catch( err => console.error( `error fetching email contact for social worker family registration questions, default contact info will be used instead`, err ) )
		// fetch the sidebar items
		.then( () => pageService.getSidebarItems() )
		// assign returned sidebar items to locals for templating
		.then( sidebarItems => {
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			// assign properties to locals for access during templating
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
		})
		// render the page with the sidebar
		.then( () => {
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// render the view using the form_social-worker-family-registration.hbs template
			view.render( 'form_social-worker-family-registration' );
		})
		// if there was an error fetching the sidebar items
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the social worker family registration form`, err );
			// render the view using the form_social-worker-family-registration.hbs template
			view.render( 'form_social-worker-family-registration' );
		});
};
