const keystone				= require( 'keystone' ),
	  moment				= require( 'moment' ),
	  userService			= require( '../middleware/service_user' ),
	  eventService			= require( '../middleware/service_event' ),
	  donationService		= require( '../middleware/service_donation' ),
	  familyService			= require( '../middleware/service_family' ),
	  listsService			= require( '../middleware/service_lists' ),
	  pageService			= require( '../middleware/service_page' ),
	  mailingListService	= require( '../middleware/service_mailing-list' );

exports = module.exports = ( req, res ) => {
    'use strict';

	const
		view						= new keystone.View( req, res ),
		locals						= res.locals,
		userType					= req.user ? req.user.userType : '', // knowing the type of user visiting the page will allow us to display extra relevant information
		userID						= req.user ? req.user._id : '',

		// find the field the user belongs to in the event model based on their user type
		eventGroup					= eventService.getEventGroup( userType ),

		// Options for fetching
		isUserStateDefined			= ( locals.user.address && locals.user.address.state ) ? true : false,
		stateOptions     		   	= isUserStateDefined ? undefined : { default: 'Massachusetts' },
		raceOptions        			= { other: true },

		// fetch all data needed to render this page
		fetchEvents					= eventService.getActiveEventsByUserId( userID, eventGroup ),

		fetchCitiesAndTowns			= listsService.getAllCitiesAndTowns(),
		fetchDisabilities			= listsService.getAllDisabilities(),
		fetchGenders				= listsService.getAllGenders(),
		fetchLanguages				= listsService.getAllLanguages(),
		fetchLegalStatuses			= listsService.getAllLegalStatuses(),
		fetchSocialWorkerPositions	= listsService.getAllSocialWorkerPositions(),
		fetchRaces					= listsService.getAllRaces( raceOptions ),
		fetchStates					= listsService.getAllStates( stateOptions ),
		fetchChildTypes				= listsService.getChildTypesForWebsite(),
		fetchMailingLists			= mailingListService.getRegistrationMailingLists()
	;

	// check to see if the Children tab should be rendered
	locals.shouldRenderChildrenSection = ( userType === 'social worker' || userType === 'family' );
	// determine if the user has permissions for bookmarking functionality
	familyService.setGalleryPermissions( req, res );

	// check to see if the page is being loaded for a newly registered user
	if ( req.query.newUser ) {

		// display the succesful registration flash message
		req.flash( 'success', { title: 'Your account has been successfully created' } );
	}

	Promise.all( [ fetchEvents, fetchCitiesAndTowns, fetchDisabilities, fetchGenders, fetchLanguages, fetchLegalStatuses,
		fetchSocialWorkerPositions, fetchRaces, fetchStates, fetchChildTypes, fetchMailingLists ] )
		.then( values => {

			// assign local variables to the values returned by the promises
			const [ events, citiesAndTowns, disabilities, genders, languages, legalStatuses,
				socialWorkerPositions, races, states, childTypes, mailingLists ] = values;

			// options to define how truncation will be handled
			const truncateOptions = { targetLength: 400 };

			// loop through all the events
			for( let event of events ) {
				// determine whether or not address information exists for the event, which is helpful during rendering
				// street1 is required, so this is enough to tell us if the address has been populated
				event.hasAddress = event.address && event.address.street1;

				// check to see if the event spans multiple days
				const multidayEvent = event.startDate.getTime() !== event.endDate.getTime();

				// Pull the date and time into a string for easier templating
				if( multidayEvent ) {
					event.dateString = `${ moment( event.startDate ).utc().format( 'dddd MMMM Do, YYYY' ) } to ${ moment( event.endDate ).utc().format( 'dddd MMMM Do, YYYY' ) }`;
				} else {
					event.dateString = moment( event.startDate ).utc().format( 'dddd MMMM Do, YYYY' );
				}
			}

			// assign properties to locals for access during templating
			locals.user						= req.user;
			locals.events					= events;
			locals.hasNoEvents				= events.length === 0;
			locals.citiesAndTowns			= citiesAndTowns;
			locals.disabilities				= disabilities;
			locals.genders					= genders;
			locals.languages				= languages;
			locals.legalStatuses			= legalStatuses;
			locals.socialWorkerPositions 	= socialWorkerPositions;
			locals.races					= races;
			locals.states					= states;
			locals.childTypes				= childTypes;
			locals.mailingLists				= mailingLists;
			locals.familyChildren			= [];

			// check to see if the user has an address/state defined
			if ( isUserStateDefined ) {

				// find the user's state in the state list
				let userState = locals.states.find( state => state._id.id.toString() === locals.user.address.state.id.toString() );
				// set it to be default selection
				userState.defaultSelection = true;
			}

			// check to see if the user is a family and has children
			if ( userType === 'family' && locals.user.numberOfChildren !== 0 ) {

				// loop through all children definitions
				for ( let i = 1; i <= locals.user.numberOfChildren; i++ ) {

					// add each child to the familyChildren array
					locals.familyChildren.push( locals.user[ `child${ i }` ] );
				}
			}

			// render the view using the account.hbs template
			view.render( 'account' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the account page - ${ err }` );
			// render the view using the account.hbs template
			view.render( 'account' );
		});
};
