const keystone		= require( 'keystone' ),
	  pageService	= require( '../middleware/service_page' );

// TODO: add code for a logged in user showing their previous donations/donation dates
exports = module.exports = function(req, res) {
    'use strict';

    const view 		= new keystone.View( req, res ),
		  locals 	= res.locals;
	
	// fetch all data needed to render this page
	let fetchSidebarItems = pageService.getSidebarItems();
    
	fetchSidebarItems
		.then( sidebarItems => {
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
		
			// assign properties to locals for access during templating
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			locals.stripeKey 			= keystone.get('stripe keys').pubKey;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the donate.hbs template
			view.render( 'donate' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the donation page ${ err }` );	
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the donate.hbs template
			view.render( 'donate' );
		});
};
