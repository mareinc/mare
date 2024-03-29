const keystone 				= require( 'keystone' ),
	  utils					= require( '../utils/utility.controllers' ),
	  successStoryService	= require( '../components/success stories/success-story.controllers' ),
	  pageService			= require( '../components/pages/page.controllers' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view 		= new keystone.View( req, res ),
    	  locals 	= res.locals;

	// set options specifying how the WYSIWYG editor content ( in HTML format ) should be modified before templating
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

	// set how the text will be truncated for short content displays
	const truncateOptions = { targetLength: 400 };

	// fetch all data needed to render this page
	let fetchSuccessStories = successStoryService.getAllSuccessStories(),
		fetchSidebarItems	= pageService.getSidebarItems();

	Promise.all( [ fetchSuccessStories, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ successStories, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			
			// loop through all success stories
			for( let successStory of successStories ) { 

				successStory.shortContent = utils.truncateText( { text: successStory.content, options: truncateOptions } );
				// append classes to the WYSIWYG generated content to allow for styling
				utils.modifyWYSIWYGContent( successStory, 'shortContent', WYSIWYGModificationOptions );
			}

			// assign properties to locals for access during templating
			locals.successStories		= successStories;
			locals.hasNoSuccessStories	= successStories.length === 0;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// render the view using the success-stories.hbs template
			view.render( 'success-stories' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the success stories page`, err );	
			// render the view using the success-stories.hbs template
			view.render( 'success-stories' );
		});
};
