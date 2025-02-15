const keystone 	    = require( 'keystone' ),
	  pageService	= require( '../components/pages/page.controllers' );

exports = module.exports = function( req, res ) {
	'use strict';

	const view 	    = new keystone.View( req, res ),
		  locals 	= res.locals;
	// extract request object parameters into local constants
	const { key } = req.params;

	// create a container for any additional page actions to render after the content
	let pageActions = {
		sections: [], // placeholder for any sections that may render after the content
		buttons: [] // placeholder for any buttons that may render in a button group after the content
	};

	// fetch all data needed to render this page
	let fetchPage			= pageService.getPageByKey( key ),
		fetchSidebarItems	= pageService.getSidebarItems();

	Promise.all( [ fetchPage, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ page, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
 
			// if the user requested the 'Register/Update a child' page
			if( page.key === 'register-update-a-child' ) {

				// prevent further execution and redirect the user to the new HubSpot portal
				const HUBSPOT_CHILD_REGISTRATION_URL = "https://www.mareinc.org/child-registration";
				return res.redirect( 301, HUBSPOT_CHILD_REGISTRATION_URL );
				// if the user is logged in as a social worker
				if( locals.user && locals.user.userType === 'social worker' ) {
					// specify that it should render a button after the content
					pageActions.hasButtons = true;
					// set the button contents
					pageActions.buttons.push( { text: 'Register/Update a Child',
												target: '/forms/social-worker-child-registration' } );
				// if the user is not a logged in social worker
				} else {
					// set the section contents
					pageActions.sections.push( `Only social workers can register children.  If you're a social worker, either log in or create an account` );
					// specify that it should render a button after the content
					pageActions.hasButtons = true;
					// set the button contents
					pageActions.buttons.push( { text: 'Create an account',
												target: '/register#social-worker' } );
					// pageActions.sections.push( `You must be logged in as a social worker to register a child.  If you're a social worker, you can <a href="/register#social-worker">register here</a>.` );
				}
			// otherwise, if the user requested the 'Register a family's homestudy' page
			} else if( page.key === 'register-a-familys-homestudy' ) {
				// if the user is logged in as a social worker
				if( locals.user && locals.user.userType === 'social worker' ) {
					// specify that it should render a button after the content
					pageActions.hasButtons = true;
					// set the button contents
					pageActions.buttons.push( { text: 'Register Homestudy',
												target: '/forms/social-worker-family-registration' } );
				// if the user is not a logged in social worker
				} else {
					// set the section contents
					pageActions.sections.push( `Only social workers can register families' homestudies.  If you're a social worker, either log in or create an account` );
					// specify that it should render a button after the content
					pageActions.hasButtons = true;
					// set the button contents
					pageActions.buttons.push( { text: 'Create an account',
												target: '/register#social-worker' } );
					// pageActions.sections.push( `You must be logged in as a social worker to register a family.  If you're a social worker, you can <a href="/register#social-worker">register here</a>.` );
				}
			// otherwise, if the user requested the 'How does MARE support families' page
			} else if( page.key === 'how-does-mare-support-families' ) {
				// specify that it should render a button after the content
				pageActions.hasButtons = true;
				// set the button contents
				pageActions.buttons.push( { text: 'Have a Question',
											target: '/forms/have-a-question' } );
			// otherwise, if the user requested any page in the 'Considering Adoption' section
			// NOTE: we check for locals.currentSection existing because it won't if the page isn't listed in the main menu
			} else if( locals.currentSection && locals.currentSection.title === 'Considering Adoption?' ) {
				// specify that it should render a button after the content
				pageActions.hasButtons = true;
				// set the button contents
				pageActions.buttons.push( { text: 'Request Adoption Information',
											target: '/forms/information-request' } );
			}
			
			// assign properties to locals for access during templating
			locals.page			        = page;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			locals.pageActions          = pageActions;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// set the layout to add classes designating this a WYSIWYG page
			locals[ 'wysiwyg-page' ] = true;
			// render the view using the page.hbs template
			view.render( 'page' );
	})
	.catch( err => {
		// log an error for debugging purposes
		console.error( `error loading data for the generic page with key ${ key }`, err );
		// set the layout to add classes designating this a WYSIWYG page
		locals[ 'wysiwyg-page' ] = true;
		// render the view using the page.hbs template
		view.render( 'page' );
	});
};
