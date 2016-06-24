(function () {
	'use strict';

	mare.views.Events = Backbone.View.extend({
		el: 'body',

        events: {
            'click .events__category-card'			: 'navigate',
            'click .events__show-categories-button'	: 'navigate',
            'click .events__show-details-button'	: 'navigate',
            'click .events__register-button'		: 'register',
            'click .events__unregister-button'		: 'unregister'
        },

        navigate: function navigate(event) {
        	window.location.href = $(event.currentTarget).data('url');
        },

        register: function register() {
        	console.log('register');
        },

        unregister: function unregister() {
        	console.log('unregister');
        }

	});
}());