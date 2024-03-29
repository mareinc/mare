const keystone				= require( 'keystone' ),
	  userService			= require( '../components/users/user.controllers' ),
	  listService			= require( '../components/lists/list.controllers' ),
	  pageService			= require( '../components/pages/page.controllers' ),
	  profileSearchService	= require( '../components/profile searches/profile.search.controllers' ),
	  hubspotService		= require( '../components/hubspot services/hubspot.controllers' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals;

	// store user type for determining gallery permissions
	const userType = req.user ? req.user.get( 'userType' ) : 'anonymous';
	// store the gallery permissions in local variables
	const { canBookmarkChildren, canSearchForChildren, canSeeAdvancedSearchOptions } = userService.getGalleryPermissions( req.user );
	// set states from which families are allowed to submit inquiries
	const ALLOWED_STATE_ABBREVIATIONS = [ 'NH', 'NY', 'ME', 'VT', 'MA', 'CT', 'RI' ];
	// store the gallery permissions on locals for templating
	locals.canBookmarkChildren			= canBookmarkChildren;
	locals.canSearchForChildren			= canSearchForChildren;
	locals.canSeeAdvancedSearchOptions	= canSeeAdvancedSearchOptions;
	
	// fetch all data needed to render this page
	let fetchDisabilities			= listService.getAllDisabilities(),
		fetchFamilyConstellations	= listService.getAllFamilyConstellations(),
		fetchGenders				= listService.getAllGenders(),
		fetchLanguages				= listService.getAllLanguages(),
		fetchRaces					= listService.getAllRaces(),
		fetchRegions				= listService.getAllRegions(),
		fetchSidebarItems			= pageService.getSidebarItems(),
		fetchSavedSearch			= profileSearchService.getProfileSearch( req.user && req.user._id.toString() );

	Promise.all( [ fetchDisabilities, fetchFamilyConstellations, fetchGenders, fetchLanguages,
				   fetchRaces, fetchRegions, fetchSidebarItems, fetchSavedSearch ] )
		.then( async values => {
			// assign local variables to the values returned by the promises
			const [ disabilities, familyConstellations, genders, languages, races, regions, sidebarItems, savedSearch, userState ] = values;
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
			locals.regions				= regions;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			locals.savedSearch			= JSON.stringify( savedSearch );
			locals.relationshipStatuses	= [ 'Single', 'Partnered', 'Unknown/Prefers Not To Answer' ];

			// determine if the user should be presented with the new HubSpot inquiry form, or if they should be routed to the legacy inquiry flow
			// user must be both logged in AND in-state to get the HubSpot form
			if ( userType !== 'anonymous' ) {

				// compose and store the base HubSpot inquiry form URL and query params
				locals.hubspotInquiryFormUrl = `https://www.mareinc.org/child-inquiry` +
					`?email=${req.user.get( 'email' )}` +
					`&keystone_record_url=${hubspotService.generateKeystoneRecordUrl( req.user._id.toString(), userType )}`;

				// if user is a family
				if ( userType === 'family' ) {
					
					let userState;
					try {

						// populate user's state data
						userState = await listService.getStateById( req.user.get( 'address.state' ) );
						// determine if user should get the HubSpot inquiry form
						locals.shouldDisplayHubSpotInquiryForm = userState && ALLOWED_STATE_ABBREVIATIONS.includes( userState.abbreviation );

					} catch( error ) {

						// log the error
						console.log( 'there was an issue validating the state of residence for a family, inquiries are disabled.' );
						console.log( `impacted family: ${req.user.get( 'displayNameAndRegistration' )}` );
						console.error( error );
					}
					
				// if user is a social worker or admin
				} else if ( userType === 'social worker' || userType === 'admin' ) {

					// always present HubSpot inquiry form
					locals.shouldDisplayHubSpotInquiryForm = true;

				// if user a site visitor
				} else {

					// always present the old flow
					locals.shouldDisplayHubSpotInquiryForm = false;
				}

			} else {
				locals.shouldDisplayHubSpotInquiryForm = false;
			}
			
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
