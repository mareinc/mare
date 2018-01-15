(function () {
    'use strict';

    mare.views.SuccessStories = Backbone.View.extend({
        el: 'body',

        events: {
            'click .success-story__navigation-button': 'navigate'
        },

        navigate: function navigate( event ) {
        	window.location.href = $( event.target ).data( 'url' );
        }
    });
}());