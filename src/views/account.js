const keystone				= require( 'keystone' ),
	  moment				= require( 'moment' ),
	  eventService			= require( '../components/events/event.controllers' ),
	  familyService			= require( '../components/families/family.controllers' ),
	  listService			= require( '../components/lists/list.controllers' );

exports = module.exports = ( req, res ) => {
    'use strict';

	const view		= new keystone.View( req, res ),
		locals		= res.locals,
		userType	= req.user ? req.user.userType : '', // knowing the type of user visiting the page will allow us to display extra relevant information
		userId		= req.user ? req.user._id : '',

		// find the field the user belongs to in the event model based on their user type
		eventGroup					= eventService.getEventGroup( userType ),

		// Options for fetching
		raceOptions        			= { other: true },

		// fetch all data needed to render this page
		fetchEvents					= eventService.getActiveEventsByUserId( userId, eventGroup ),

		fetchCitiesAndTowns			= listService.getAllCitiesAndTowns(),
		fetchDisabilities			= listService.getAllDisabilities(),
		fetchGenders				= listService.getAllGenders(),
		fetchLanguages				= listService.getAllLanguages(),
		fetchLegalStatuses			= listService.getAllLegalStatuses(),
		fetchSocialWorkerPositions	= listService.getAllSocialWorkerPositions(),
		fetchRaces					= listService.getAllRaces( raceOptions ),
		fetchStates					= listService.getAllStates(),
		fetchChildTypes				= listService.getChildTypesForWebsite();

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
		fetchSocialWorkerPositions, fetchRaces, fetchStates, fetchChildTypes ] )
		.then( values => {

			// assign local variables to the values returned by the promises
			const [ events, citiesAndTowns, disabilities, genders, languages, legalStatuses,
				socialWorkerPositions, races, states, childTypes ] = values;

			// loop through all the events
			for( let event of events ) {
				// determine whether or not address information exists for the event, which is helpful during rendering
				// street1 is required, so this is enough to tell us if the address has been populated
				event.hasAddress = event.address && event.address.street1;

				// check to see if the event spans multiple days
				const multidayEvent = event.startDate && event.endDate
					? event.startDate.getTime() !== event.endDate.getTime()
					: false;

				// Pull the date and time into a string for easier templating
				if( multidayEvent ) {
					event.dateString = `${ moment( event.startDate ).utc().format( 'dddd MMMM Do, YYYY' ) } to ${ moment( event.endDate ).utc().format( 'dddd MMMM Do, YYYY' ) }`;
				} else {
					event.dateString = moment( event.startDate ).utc().format( 'dddd MMMM Do, YYYY' );
				}
			}

			// check to see if the user has an address/state defined
			if ( req.user.address && req.user.address.state ) {
				// find the user's state in the state list
				let userState = states.find( state => state._id.toString() === req.user.address.state.toString() );
				// set it to be default selection
				userState.defaultSelection = true;
			}

			let familyChildren = [];

			// check to see if the user is a family and has children
			if ( userType === 'family' && req.user.numberOfChildren !== 0 ) {

				// loop through all child definitions
				for ( let i = 1; i <= req.user.numberOfChildren; i++ ) {

					// add each child to the familyChildren array
					familyChildren.push( req.user[ `child${ i }` ] );
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
			locals.familyChildren			= familyChildren;

			// render the view using the account.hbs template
			view.render( 'account' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the account page`, err );
			// render the view using the account.hbs template
			view.render( 'account' );
		});
};
