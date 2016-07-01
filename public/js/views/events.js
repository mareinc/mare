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

			var options = {
				eventId: $(event.target).data('event-id'),
				service: 'register-for-event'
			}

			this.callEventService(options);
        },

        unregister: function unregister() {

			var options = {
				eventId: $(event.target).data('event-id'),
				service: 'unregister-for-event'
			}

			this.callEventService(options);

        },

		callEventService: function callEventService(options) {

			$.ajax({
				url: '/services/' + options.service,
				type: 'POST',
				data: {
					eventId: options.eventId
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
		}

	});
}());
