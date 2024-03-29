const keystone 				= require( 'keystone' ),
	  utils					= require( '../utils/utility.controllers' ),
	  mareInTheNewsService	= require( '../components/mare in the news stories/mare-in-the-news.controllers' ),
	  pageService			= require( '../components/pages/page.controllers' );

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
	}];

	// fetch all data needed to render this page
	let fetchMAREInTheNewsStory = mareInTheNewsService.getMAREInTheNewsStoryByKey( key ),
		fetchSidebarItems		= pageService.getSidebarItems();

	Promise.all( [ fetchMAREInTheNewsStory, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ mareInTheNewsStory, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;

			// modify the WYSIWYG generated content to allow for styling
			utils.modifyWYSIWYGContent( mareInTheNewsStory, 'content', WYSIWYGModificationOptions );

			// assign properties to locals for access during templating
			locals.mareInTheNewsStory	= mareInTheNewsStory;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = false;
			// render the view using the mare-in-the-news-story.hbs template
			view.render( 'mare-in-the-news-story' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the MARE in the news story page`, err );	
			// render the view using the mare-in-the-news-story.hbs template
			view.render( 'mare-in-the-news-story' );
		});
};
