const keystone		= require( 'keystone' ),
	  listService	= require( '../components/lists/list.controllers' ),
	  pageService	= require( '../components/pages/page.controllers' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 			= new keystone.View( req, res ),
		  locals 		= res.locals;
	
	// objects with additional search parameters
	const stateOptions	= { default: 'Massachusetts' };

	// fetch all data needed to render this page
	let fetchStates			= listService.getAllStates( stateOptions ),
		fetchEventTypes		= listService.getEventTypesForWebsite(),
		fetchSidebarItems	= pageService.getSidebarItems();

	Promise.all( [ fetchStates, fetchEventTypes, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ states, eventTypes, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			
			// assign properties to locals for access during templating
			locals.states				= states;
			locals.eventTypes			= eventTypes;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;
			
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the form_agency-event-submission.hbs template
			view.render( 'form_agency-event-submission' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the agency event submission form`, err );
			// render the view using the form_agency-event-submission.hbs template
			view.render( 'form_agency-event-submission' );
		});
};
