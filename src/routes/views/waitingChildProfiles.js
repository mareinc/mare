const keystone		= require( 'keystone' ),
	  userService	= require( '../middleware/service_user' ),
	  listsService	= require( '../middleware/service_lists' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals;

	// store user type for determining gallery permissions
	const userType = req.user ? req.user.get( 'userType' ) : 'anonymous';
	// store the gallery permissions in local variables
	const { canBookmarkChildren, canSearchForChildren, canSeeAdvancedSearchOptions } = userService.getGalleryPermissions( req.user );
	// store the gallery permissions on locals for templating
	locals.canBookmarkChildren			= canBookmarkChildren;
	locals.canSearchForChildren			= canSearchForChildren;
	locals.canSeeAdvancedSearchOptions	= canSeeAdvancedSearchOptions;
	
	// fetch all data needed to render this page
	let fetchDisabilities			= listsService.getAllDisabilities(),
		fetchFamilyConstellations	= listsService.getAllFamilyConstellations(),
		fetchGenders				= listsService.getAllGenders(),
		fetchLanguages				= listsService.getAllLanguages(),
		fetchRaces					= listsService.getAllRaces(),
		fetchSidebarItems			= pageService.getSidebarItems();

	Promise.all( [ fetchDisabilities, fetchFamilyConstellations, fetchGenders, fetchLanguages,
				   fetchRaces, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ disabilities, familyConstellations, genders, languages, races, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			// assign properties to locals for access during templating
			locals.disabilities			= disabilities;
			locals.familyConstellations	= familyConstellations;
			// if the user doesn't have access to advanced search options, they shouldn't have access to the transgender option in the search form
			locals.genders				= locals.canSeeAdvancedSearchOptions ?
										  genders :
										  genders.filter( gender => gender.get( 'gender' ) !== 'transgender' );
			locals.languages			= languages;
			locals.races				= races;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;

			// render the view using the waiting-child-profiles.hbs template
			view.render( 'waiting-child-profiles' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the waiting child profiles page`, err );
			// render the view using the waiting-child-profiles.hbs template
			view.render( 'waiting-child-profiles' );
		});
	};
