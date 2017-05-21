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
            $( '#slideshow' ).owlCarousel({
                autoPlay : 5000,
                singleItem : true,
                lazyLoad : true,
                lazyEffect: 'fade',
                autoHeight: true,
                transitionStyle : 'fade'
            });
            // prevents the slideshow image descriptions from loading in before the images do
            // TODO: This doesn't seem to be working as well as it needs to.
            $( '#slideshow img' ).load(function() {
                $(this).siblings( '.slideshow__description' ).removeClass( 'hidden' );
            });
        }

    });
}());