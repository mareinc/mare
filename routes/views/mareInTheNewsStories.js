const keystone 				= require( 'keystone' ),
	  Utils					= require( '../middleware/utilities' ),
	  mareInTheNewsService	= require( '../middleware/service_mare-in-the-news' ),
	  pageService			= require( '../middleware/service_page' );

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
				
				story.shortContent = Utils.truncateText( story.content, truncateOptions );
				// append classes to the WYSIWYG generated content to allow for styling
				// Utils.modifyWYSIWYGContent( story, 'shortContent', WYSIWYGModificationOptions );
			}
			
			// assign properties to locals for access during templating
			locals.stories						= stories;
			locals.hasNoMAREInTheNewsStories	= stories.length === 0,
			locals.randomSuccessStory			= randomSuccessStory;
			locals.randomEvent					= randomEvent;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the mare-in-the-news.hbs template
			view.render( 'mare-in-the-news-stories' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the MARE in the news page - ${ err }` );
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the mare-in-the-news.hbs template
			view.render( 'mare-in-the-news-stories' );
		});
};
