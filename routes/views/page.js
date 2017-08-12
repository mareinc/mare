const keystone 	    = require( 'keystone' ),
	  pageService	= require( '../middleware/service_page' );

exports = module.exports = function( req, res ) {
	'use strict';

	const view 	    = new keystone.View( req, res ),
		  locals 	= res.locals;
	
	// create a container for any additional page actions to render after the content
	let pageActions = {
		buttons: [], // placeholder for any buttons that may render in a button group after the content
		sections: [] // placeholder for any sections that may render after the content
	};

	// fetch all data needed to render this page
	let fetchPage			= pageService.getPageByUrl( req.originalUrl ),
		fetchSidebarItems	= pageService.populateSidebar();

	Promise.all( [ fetchPage, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ page, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
 
			// if the user requested the 'Register a child' page
			if( page.get( 'key' ) === 'register-a-child' ) {
				// if the user is logged in as a social worker
				if( locals.user && locals.user.userType === 'social worker' ) {
					// specify that it should render a button after the content
					pageActions.hasButtons = true;
					// set the button contents
					pageActions.buttons.push( { text: 'Register a Child', target: '/forms/child-registration-form' } );
				// if the user is not a logged in social worker
				} else {
					// set the section contents
					pageActions.sections.push( `You must be logged in as a social worker to register a child.  If you're a social worker, you can <a href="/register#social-worker">register here</a>.` );
				}
			// otherwise, if the user requested the 'Register a family' page
			} else if( page.get( 'key' ) === 'register-a-family' ) {
				// if the user is logged in as a social worker
				if( locals.user && locals.user.userType === 'social worker' ) {
					// specify that it should render a button after the content
					pageActions.hasButtons = true;
					// set the button contents
					pageActions.buttons.push( { text: 'Register a Family', target: '/forms/family-registration-form' } );
				// if the user is not a logged in social worker
				} else {
					// set the section contents
					pageActions.sections.push( `You must be logged in as a social worker to register a family.  If you're a social worker, you can <a href="/register#social-worker">register here</a>.` );
				}
			// otherwise, if the user requested any page in the 'Considering Adoption' section
			} else if( locals.currentSection.title === 'Considering Adoption?' ) {
				// specify that it should render a button after the content
				pageActions.hasButtons = true;
				// set the button contents
				pageActions.buttons.push( { text: 'Request Adoption Information', target: '/forms/information-request-form' } );
			}

			// assign properties to locals for access during templating
			locals.page			        = page;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			locals.pageActions          = pageActions;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the page.hbs template
			view.render( 'page' );
	})
	.catch( () => {
		// log an error for debugging purposes
		console.error( `there was an error loading data for the generic page` );
		// set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// render the view using the page.hbs template
		view.render( 'page' );
	});
};
