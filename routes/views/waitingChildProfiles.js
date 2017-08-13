const keystone		= require( 'keystone' ),
	  familyService	= require( '../middleware/service_family' ),
	  listsService	= require( '../middleware/service_lists' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals;

	// store user type for determining gallery permissions
	const userType = req.user ? req.user.get( 'userType' ) : 'anonymous';

	familyService.setGalleryPermissions( req, res );
	familyService.checkForBookmarkedChildren( req, res );
	
	// fetch all data needed to render this page
	let fetchDisabilities			= listsService.getAllDisabilities(),
		fetchFamilyConstellations	= listsService.getAllFamilyConstellations(),
		fetchGenders				= listsService.getAllGenders(),
		fetchLanguages				= listsService.getAllLanguages(),
		fetchOtherConsiderations	= listsService.getAllOtherConsiderations(),
		fetchRaces					= listsService.getAllRaces(),
		fetchSidebarItems			= pageService.getSidebarItems();

	Promise.all( [ fetchDisabilities, fetchFamilyConstellations, fetchGenders, fetchLanguages,
				   fetchOtherConsiderations, fetchRaces, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ disabilities, familyConstellations, genders, languages,
					otherConsiderations, races, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			
			// assign properties to locals for access during templating
			locals.disabilities			= disabilities;
			locals.familyConstellations	= familyConstellations;
			locals.genders				= genders;
			locals.languages			= languages;
			locals.otherConsiderations	= otherConsiderations;
			locals.races				= races;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;

			// set the layout to render without the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// render the view using the waiting-child-profiles.hbs template
			view.render( 'waiting-child-profiles' );
		})
		.catch( () => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the waiting child profiles page` );
			// set the layout to render without the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// render the view using the waiting-child-profiles.hbs template
			view.render( 'waiting-child-profiles' );
		});
	};
