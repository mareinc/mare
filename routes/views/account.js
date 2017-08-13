const keystone		= require( 'keystone' ),
	  moment		= require( 'moment' ),
	  userService	= require( '../middleware/service_user' ),
	  eventService	= require( '../middleware/service_event' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view		= new keystone.View( req, res ),		  
		  locals	= res.locals,
		  userType	= req.user ? req.user.userType : ''; // knowing the type of user visiting the page will allow us to display extra relevant information

	// find the field the user belongs to in the event model based on their user type
	const eventGroup = eventService.getEventGroup( userType );
	
	// assign properties to locals for access during templating
	locals.user = req.user;

	// fetch all data needed to render this page
	let fetchEvents = eventService.getAllActiveEvents( eventGroup );

	Promise.resolve( fetchEvents )
		.then( values => {
			// assign local variables to the values returned by the promises
			const events = values;

			// options to define how truncation will be handled
			const truncateOptions = { targetLength: 400 }

			// loop through all the events
			for( let event of events ) {
				// the list page needs truncated details information to keep the cards they're displayed on small
				event.shortContent = Utils.truncateText( event.description, truncateOptions );
				// determine whether or not address information exists for the event, which is helpful during rendering
				// street1 is required, so this is enough to tell us if the address has been populated
				event.hasAddress = event.address && event.address.street1 ? true : false;

				for( let attendee of event[ eventGroup ] ) {
					// without converting to strings, these were both evaluating to Object which didn't allow for a clean comparison
					var attendeeID	= attendee._id.toString(),
						userID		= req.user._id.toString();

					// determine whether the user has already attended the event
					event.attended = attendeeID === userID ? true : false;
				}

				// check to see if the event spans multiple days
				const multidayEvent = event.startDate.getTime() !== event.endDate.getTime();
				
				// Pull the date and time into a string for easier templating
				if( multidayEvent ) {
					event.dateString = moment( event.startDate ).format( 'dddd MMMM Do, YYYY' ) + ' to ' + moment( event.endDate ).format( 'dddd MMMM Do, YYYY' );
				} else {
					event.dateString = moment( event.startDate ).format( 'dddd MMMM Do, YYYY' );
				}
			}

			// assign properties to locals for access during templating
			locals.events		= events;
			locals.hasNoEvents	= events.length === 0;

			// set the layout to render without the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// render the view using the account.hbs template
			view.render( 'account' );
		})
		.catch( ( err ) => {
			// log an error for debugging purposes
			console.error( `there was an error loading event data for the account page - ${err}` );	
			// set the layout to render without the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// render the view using the account.hbs template
			view.render( 'account' );
		})
	;
};