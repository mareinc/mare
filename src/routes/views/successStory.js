const keystone 				= require( 'keystone' ),
	  utils					= require( '../../utils/utilities.controllers' ),
	  successStoryService	= require( '../../components/success stories/success-story.controllers' ),
	  pageService			= require( '../../components/pages/page.controllers' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view 		= new keystone.View( req, res ),
		 locals 	= res.locals;
	// extract request object parameters into local constants
	const { key } = req.params;

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
	let fetchSuccessStory 	= successStoryService.getSuccessStoryByKey( key ),
		fetchSidebarItems	= pageService.getSidebarItems();

	Promise.all( [ fetchSuccessStory, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ successStory, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;

			// modify the WYSIWYG generated content to allow for styling
			utils.modifyWYSIWYGContent( successStory, 'content', WYSIWYGModificationOptions );

			// assign properties to locals for access during templating
			locals.successStory			= successStory;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the success-story.hbs template
			view.render( 'success-story' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading page data for the success story with key ${ key }`, err );	
			// render the view using the success-story.hbs template
			view.render( 'success-story' );
		});
};
