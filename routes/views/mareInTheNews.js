const keystone 				= require( 'keystone' ),
	  mareInTheNewsService	= require( '../middleware/service_mare-in-the-news' ),
	  pageService			= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view 		= new keystone.View( req, res ),
		  locals 	= res.locals;
	// extract request object parameters into local constants
	const { key } = req.params;
	
	// fetch all data needed to render this page
	let fetchMAREInTheNewsStory	= mareInTheNewsService.getMAREInTheNewsByKey( key ),
		fetchSidebarItems		= pageService.getSidebarItems();

	Promise.all( [ fetchMAREInTheNewsStory, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ story, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			
			// assign properties to locals for access during templating
			locals.story				= story;
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the mare-in-the-news.hbs template
			view.render( 'mare-in-the-news' );
		})
		.catch( () => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the MARE in the news page` );
			// Set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the mare-in-the-news.hbs template
			view.render( 'mare-in-the-news' );
		});
};
