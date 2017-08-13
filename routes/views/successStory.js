const keystone 				= require( 'keystone' ),
	  Utils					= require( '../middleware/utilities' ),
	  successStoryService	= require( '../middleware/service_success-story' ),
	  pageService			= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view 		= new keystone.View( req, res );
    const locals 	= res.locals;

	// set options specifying how the WYSIWYG editor content (in HTML format) should be modified before templating
	const WYSIWYGModificationOptions = [{
		action: 'add classes',
		element: 'p',
		classesToAdd: 'card-details__paragraph',
		targetAll: true
	}, {
		action: 'add more links',
		element: 'p',
		targetAll: false,
		targetsArray: [ 0 ]
	}];

	// fetch all data needed to render this page
	let fetchSuccessStory 	= successStoryService.getSuccessStoryByUrl( req.originalUrl ),
		fetchSidebarItems	= pageService.getSidebarItems();

	Promise.all( [ fetchSuccessStory, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ successStory, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;

			// modify the WYSIWYG generated content to allow for styling
			Utils.modifyWYSIWYGContent( successStory, 'content', WYSIWYGModificationOptions );

			// assign properties to locals for access during templating
			locals.successStory			= successStory;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the success-story.hbs template
			view.render( 'success-story' );
		})
		.catch( () => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the success stories page` );	
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the success-story.hbs template
			view.render( 'success-story' );
		});
};
