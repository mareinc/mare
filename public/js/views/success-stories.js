(function () {
    'use strict';

    mare.views.SuccessStories = Backbone.View.extend({
        el: 'body',

        events: {
            'click .card__button'	: 'loadSuccessStory'
        },

        loadSuccessStory: function(event) {
        	window.location.href = $(event.target).data('url');
        }

    });
}());