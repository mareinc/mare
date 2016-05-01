(function () {
    'use strict';

    mare.views.Home = Backbone.View.extend({
        el: 'body',

        events: {
            'click .panel-toggle'	: 'toggleFeaturePanel'
        },

        initialize: function() {
        	// DOM cache any commonly used elements to improve performance
        	this.$featuredPanelOverlay = $('.panel-overlay');
            // initialize the owl carousel and make any needed modifications to carousel image loading
            this.initializeCarousel();
        },

        /* Shows/hides the list of events in the rightmost featured panel under the carousel */
        toggleFeaturePanel: function toggleFeaturePanel() {
            this.$featuredPanelOverlay.toggleClass('panel-overlay--closed');
        },

        /* initializes the carousel */
        initializeCarousel: function initializeCarousel() {
            // initialize the carousel default settings
            $("#owl-demo").owlCarousel({
                autoPlay : 3000,
                stopOnHover: true,
                singleItem : true,
                lazyLoad : true,
                lazyEffect: 'fade',
                autoHeight: true,
                transitionStyle : 'fade'
            });
            // prevents the carousel image descriptions from loading in before the images do
            // TODO: This doesn't seem to be working as well as it needs to.
            $('#owl-demo img').load(function() {
                $(this).siblings('.featured-description').removeClass('hidden');
            });
        }

    });
})();