const keystone		= require( 'keystone' ),
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
	locals.isSocialWorker = req.user ? req.user.userType === 'social worker' : false;
	locals.isFamily = req.user ? req.user.userType === 'family' : false;
	locals.isSiteVisitor = req.user ? req.user.userType === 'site visitor' : false;

	// if a family or social worker accesses this page...
	if ( locals.isFamily || locals.isSocialWorker ) {

		// display a flash message pointing them to the new HubSpot inquiry flow
		req.flash( 'info', { title: 'Thanks for your interest in making an inquiry!', detail: 'Please use the gallery below to begin the process by clicking Inquire on a profile.' } );
		// redirect them to the child gallery
		return res.redirect( 301, '/waiting-child-profiles' );
	}

	fetchSidebarItems
		.then( sidebarItems => {
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			
			// assign properties to locals for access during templating
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = false;
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
