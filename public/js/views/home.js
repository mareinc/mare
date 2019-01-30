(function () {
    'use strict';

    mare.views.Home = Backbone.View.extend({
        el: 'body',

        initialize: function() {
        	// DOM cache any commonly used elements to improve performance
        	this.$featuredPanelOverlay = $( '.panel-overlay' );
            // initialize the owl carousel and make any needed modifications to slideshow image loading
            this.initializeSlideshow();
        },

        /* initializes the slideshow */
        initializeSlideshow: function initializeSlideshow() {
            // initialize the slideshow default settings
            $( '.owl-carousel' ).owlCarousel({
                autoHeight: true,
                autoplay: true,
                autoplaySpeed: 5000,
                lazyLoadEager: 1,
                dots: false,
                items : 1,
                lazyLoad : true,
                loop: true,
                animateOut: 'fadeOut'
            });
            // prevents the slideshow image descriptions from loading in before the images do
            // TODO: This doesn't seem to be working as well as it needs to.
            $( '.owl-carousel img' ).load(function() {
                $(this).siblings( '.slideshow__description' ).removeClass( 'hidden' );
            });
        }

    });
}());