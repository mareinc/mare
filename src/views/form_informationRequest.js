const keystone		= require( 'keystone' ),
	  listService	= require( '../components/lists/list.controllers' ),
	  pageService	= require( '../components/pages/page.controllers' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 				= new keystone.View( req, res ),
		  locals 			= res.locals;
	
	// fetch all data needed to render this page
	let fetchSidebarItems = pageService.getSidebarItems();

	// pull registration number(s) from query params to pre-populate form fields
	locals.registrationNumbers = req.query.registrationNumber;
	// if there are registration numbers in the query parameters, we know it's a child inquiry
	locals.isChildInquiry = !!locals.registrationNumbers;
	// some fields are only visible to social workers
	locals.isSocialWorker = req.user ? req.user.userType === 'social worker' : false

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
			console.error( `error loading data for the information request form`, err );
			// render the view using the form_information-request.hbs template
			view.render( 'form_information-request' );
		});
};
