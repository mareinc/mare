const keystone				= require( 'keystone' ),
	  _						= require( 'underscore' ),
	  slideshowService		= require( '../middleware/service_slideshow' ),
	  featuredItemService	= require( '../middleware/service_featured-item' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals;

	// fetch all data needed to render this page
	let fetchSlideshow		= slideshowService.fetchSlideshow( { title: 'Main Page Slideshow' } ),
		fetchFeaturedItems	= featuredItemService.fetchFeaturedItems();

	Promise.all( [ fetchSlideshow, fetchFeaturedItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ slideshow, featuredItems ] = values;
			
			// assign properties to locals for access during templating
			locals.featuredItems = featuredItems;

			// fetch the slides for the slideshow
			return slideshowService.fetchSlides( { slideshowId: slideshow.get( '_id' ) } );
		})
		.then( slides => {
			/* TODO: Can possibly remove slide order if I use sortable in the Model.  See DB section of the documentation */
			// assign properties to locals for access during templating
			locals.slides = _.sortBy( slides, slide => +slide.order ); // organize the slides in the order specified in the models, low to high

			// set the layout to render without the right sidebar and without a wrapper needed for the full width slideshow
			locals[ 'render-with-sidebar' ] = false;
			locals[ 'render-homepage' ] = true;
			
			// render the view using the main.hbs template
			view.render( 'main' );
		})
		.catch( () => {
			// log an error for debugging purposes
			console.error( `there was an error loading data for the homepage` );
			
			// set the layout to render without the right sidebar and without a wrapper needed for the full width slideshow
			locals[ 'render-with-sidebar' ] = false;
			locals[ 'render-homepage' ] = true;
			
			// render the view using the main.hbs template
			view.render( 'main' );
		});
};