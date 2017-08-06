const keystone				= require( 'keystone' ),
	  _						= require( 'underscore' ),
	  slideshowService		= require( '../middleware/service_slideshow' ),
	  featuredItemService	= require( '../middleware/service_featured-item' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals;

	const slideshowFetched		= slideshowService.fetchSlideshow( { title: 'Main Page Slideshow' } ),
		  featuredItemsFetched	= featuredItemService.fetchFeaturedItems();
	// once the slideshow _id has been fetched
	slideshowFetched.then( slideshowId => {
			// fetch the slides for the slideshow
			const slidesFetched = slideshowService.fetchSlides( { slideshowId: slideshowId } );
			// once we have both the slides and the featured items needed to render the page
			Promise.all( [ featuredItemsFetched, slidesFetched ] ).then( values => {
				// assign local variables to the values returned by the promises
				const [ featuredItems, slides ] = values;
				/* TODO: Can possibly remove slide order if I use sortable in the Model.  See DB section of the documentation */
				// add the slides and featured items to locals for access during templating
				locals.slides			= _.sortBy( slides, slide => +slide.order ); // organizing the slides in the order specified in the models, low to high
				locals.featuredItems	= featuredItems;

				// set the layout to render without the right sidebar and without a header
				locals[ 'render-with-sidebar' ] = false;
				locals[ 'render-homepage' ] = true;
				// render the view once all the data has been retrieved
				view.render( 'main' );
			})
			.catch( reason => {
				console.log( `error fetching slideshow or featured items, can't render the homepage` );
				console.log( reason );
			});
		})
		.catch( reason => {
			console.log( reason );
		});
};