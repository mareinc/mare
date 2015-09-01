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
			
			var slideshowId = slideshow[0].get('_id');

			SlideshowItems.model.find()
				.where('parent', slideshowId)
				.exec()
				.then(function (slides) {
					locals.slides = _.sortBy(slides, function(slide) { return +slide.order; });

				}).then(function() {
					FeaturedItems.model.find()
						.exec()
						.then(function(featuredItems) {

							locals.featuredItems = featuredItems;

							view.render('main');
						});
				});
		});
};