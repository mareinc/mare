//TODO: Clean this up with async

var keystone = require('keystone'),
	_ = require('underscore');

// Load models to allow fetching of slideshow data
var Slideshow = keystone.list('Slideshow'),
	SlideshowItems = keystone.list('Slideshow Item'),
	FeaturedItems = keystone.list('Featured Item');

exports = module.exports = function(req, res) {
	'use strict';

	var view = new keystone.View(req, res),
		locals = res.locals;

	Slideshow.model.find()
		.where('title', 'Main Page Slideshow')
		.exec()
		.then(function (slideshow) {
			if(!slideshow) {
				console.log('unable to load the slideshow');
			}

			var slideshowId = slideshow[0].get('_id');

			// TODO: Change to callbacks instead of promises (This should be done globally across views and middleware)
			SlideshowItems.model.find()
				.where('parent', slideshowId)
				.exec()
				.then(function (slides) {
					/* TODO: Can possible remove slide order if I use sortable in the Model.  See DB section of the documentation */
					locals.slides = _.sortBy(slides, function(slide) { return +slide.order; });

				}).then(function() {
					FeaturedItems.model.find()
						.exec()
						.then(function(featuredItems) {

							locals.featuredItems = featuredItems;

							// Set the layout to render without the right sidebar
							locals['render-with-sidebar'] = false;
							// Render the view once all the data has been retrieved
							view.render('main');
							// TODO: If the necessary elements don't exist on the page, maybe render
							//       a blank page to allow logging in and creating them
						});
				});
		});
};