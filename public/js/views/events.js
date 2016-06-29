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

			var eventId = $(event.target).data('event-id');

			$.ajax({
				url: '/services/register-for-event',
				type: 'POST',
				data: {
					eventId: eventId
				}
			}).done(function(response) {
				console.log(response);
				// Once the bookmark has been saved successfully, change the icon, re-enable the bookmark, and show it as active
				// $currentTarget.children('.bookmark__icon').removeClass('fa-plus-square-o').addClass('fa-minus-square-o');
				// $currentTarget.removeClass('bookmark--disabled');
				// $currentTarget.addClass('bookmark--active');

			}).fail(function(err) {
				// TODO: Show an error message to the user
				console.log(err);
			});
        },

        unregister: function unregister() {
        	console.log('unregister');
        }

	});
}());
