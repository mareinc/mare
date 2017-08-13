const keystone		= require( 'keystone' ),
	  moment		= require( 'moment' ),
	  userService	= require( '../middleware/service_user' ),
	  eventService	= require( '../middleware/service_event' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view		= new keystone.View( req, res ),		  
		  locals	= res.locals,
		  userId	= req.user.get( '_id' ),
		  userType	= req.user.userType; // knowing the type of user visiting the page will allow us to display the correct sections for their account

	// find the field the user belongs to in the event model based on their user type
	const eventGroup = eventService.getEventGroup( userType );

	// TODO: the getActiveEventsByUserId query will need to be updated to filter results based on the user id.
	//  	 The user id will be in the field stored in the eventGroup variable
	// fetch all data needed to render this page
	let fetchEvents = eventService.getActiveEventsByUserId( userId, eventGroup );

	Promise.all( [ fetchEvents ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ events ] = values;

			// loop through all the events
			for( let event of events ) {
				// determine whether or not address information exists for the event, which is helpful during rendering
				// street1 is required, so this is enough to tell us if the address has been populated
				event.hasAddress = event.address && event.address.street1 ? true : false;

				// check to see if the event spans multiple days
				const multidayEvent = event.startDate.getTime() !== event.endDate.getTime();
				
				// Pull the date and time into a string for easier templating
				if( multidayEvent ) {
					event.dateString = `${ moment( event.startDate ).format( 'dddd MMMM Do, YYYY' ) } to ${ moment( event.endDate ).format( 'dddd MMMM Do, YYYY' ) }`;
				} else {
					event.dateString = moment( event.startDate ).format( 'dddd MMMM Do, YYYY' );
				}
			}

			// assign properties to locals for access during templating
			locals.user			= req.user;
			locals.events		= events;
			locals.hasNoEvents	= events.length === 0;

			// set the layout to render without the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// render the view using the account.hbs template
			view.render( 'account' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the account page - ${ err }` );	
			// set the layout to render without the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// render the view using the account.hbs template
			view.render( 'account' );
		})
	;
};