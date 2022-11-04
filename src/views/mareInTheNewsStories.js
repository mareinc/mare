const keystone 				= require( 'keystone' ),
	  utils					= require( '../utils/utility.controllers' ),
	  mareInTheNewsService	= require( '../components/mare in the news stories/mare-in-the-news.controllers' ),
	  pageService			= require( '../components/pages/page.controllers' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view 		= new keystone.View( req, res ),
		  locals 	= res.locals;
	
	// set how the text will be truncated for short content displays
	const truncateOptions = { targetLength: 400 };
	
	// fetch all data needed to render this page
	let fetchMAREInTheNewsStories	= mareInTheNewsService.getAllMAREInTheNewsStories(),
		fetchSidebarItems			= pageService.getSidebarItems();

	Promise.all( [ fetchMAREInTheNewsStories, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ stories, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;

			// loop through all success stories
			for( let story of stories ) { 
				
				story.shortContent = utils.truncateText( { text: story.content, options: truncateOptions } );
				// append classes to the WYSIWYG generated content to allow for styling
				// utils.modifyWYSIWYGContent( story, 'shortContent', WYSIWYGModificationOptions );
			}
			
			// assign properties to locals for access during templating
			locals.stories						= stories;
			locals.hasNoMAREInTheNewsStories	= stories.length === 0,
			locals.randomSuccessStory			= randomSuccessStory;
			locals.randomEvent					= randomEvent;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// render the view using the mare-in-the-news.hbs template
			view.render( 'mare-in-the-news-stories' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the MARE in the news page`, err );
			// render the view using the mare-in-the-news.hbs template
			view.render( 'mare-in-the-news-stories' );
		});
};
