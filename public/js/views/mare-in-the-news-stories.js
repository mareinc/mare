(function () {
    'use strict';

    mare.views.MAREInTheNews = Backbone.View.extend({
        el: 'body',

        events: {
            'click .mare-in-the-news__navigation-button': 'navigate'
        },

        navigate: function navigate( event ) {
        	window.location.href = $( event.target ).data( 'url' );
        }
    });
}());