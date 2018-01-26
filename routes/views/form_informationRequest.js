const keystone		= require( 'keystone' ),
	  listsService	= require( '../middleware/service_lists' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 				= new keystone.View( req, res ),
		  locals 			= res.locals;
	
	// fetch all data needed to render this page
	let fetchSidebarItems			= pageService.getSidebarItems();

	fetchSidebarItems
		.then( sidebarItems => {
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			
			// assign properties to locals for access during templating
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the form_information-request.hbs template
			view.render( 'form_information-request' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the information request form - ${ err }` );
			// Set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the form_information-request.hbs template
			view.render( 'form_information-request' );
		});
};
