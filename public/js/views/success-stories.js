(function () {
    'use strict';

    mare.views.SuccessStories = Backbone.View.extend({
        el: 'body',

        events: {
            'click .success-story__button'	: 'navigate'
        },

        navigate: function navigate( event ) {
        	window.location.href = $( event.target ).data( 'url' );
        }
    });
}());