const keystone		= require( 'keystone' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 		= new keystone.View( req, res ),
		  locals 	= res.locals;
	
	// fetch all data needed to render this page
	let fetchSidebarItems = pageService.populateSidebar();
    
	fetchSidebarItems
		.then( sidebarItems => {
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
		
			// assign properties to locals for access during templating
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;	  

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the form_have-a-question.hbs template
			view.render( 'form_have-a-question' );
		})
		.catch( () => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the have a question form` );
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the form_have-a-question.hbs template
			view.render( 'form_have-a-question' );
		});
};
