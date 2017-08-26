const keystone	    = require( 'keystone' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals;

	// create a container for any additional page actions to render after the content
	let pageActions = {
		buttons: [] // placeholder for any buttons that may render after the content
	};

	// fetch all data needed to render this page
	let fetchSidebarItems = pageService.getSidebarItems();

	fetchSidebarItems
		.then( sidebarItems => {
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;

			// specify that it should render a button after the content
			pageActions.hasButtons = true;
			// set the button contents
			pageActions.buttons.push( { text	: 'Request Adoption Information',
										target	: '/forms/information-request-form' } );
		
			// assign properties to locals for access during templating
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			locals.pageActions			= pageActions;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the steps-in-the-process.hbs template
			view.render( 'steps-in-the-process' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the steps in the process page - ${ err }` );
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the steps-in-the-process.hbs template
			view.render( 'steps-in-the-process' );
		});
};
