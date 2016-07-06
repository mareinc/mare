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
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// Create a promise to resolve once the user has been successfully registered
			mare.promises.registered = $.Deferred();

			var $button = $(event.target);
			// Disable the button to prevent multiple clicks
			mare.utils.disableButton($button);

			var options = {
				eventId: $button.data('event-id'),
				service: 'register-for-event',
				action: 'register'
			};

			this.callEventService(options);

			// Update the button once the user has been successfully registered
			mare.promises.registered.done(function() {
				// Remove the click event handler for the register button
				view.unbindRegisterButton();
				// DOM cache the button for performance
				var $button = $('.events__register-button');
				// Change the button text and apply the correct class
				$button.html('Unregister');
				$button.removeClass('events__register-button').addClass('events__unregister-button');
				// Add the click event handler for the unregister button
				view.bindUnregisterButton();
				// Enable the button to allow additional click events to be handled
				mare.utils.enableButton($button);
			});
        },

        unregister: function unregister() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// Create a promise to resolve once the user has been successfully unregistered
			mare.promises.unregistered = $.Deferred();

			var $button = $(event.target);
			// Disable the button to prevent multiple clicks
			mare.utils.disableButton($button);

			var options = {
				eventId: $button.data('event-id'),
				service: 'unregister-for-event',
				action: 'unregister'
			};

			this.callEventService(options);

			// Update the button once the user has been successfully unregistered
			mare.promises.unregistered.done(function() {
				// Remove the click event handler for the register button
				view.unbindUnregisterButton();
				// DOM cache the button for performance
				var $button = $('.events__unregister-button');
				// Change the button text and apply the correct class
				$button.html('Register');
				$button.removeClass('events__unregister-button').addClass('events__register-button');
				// Add the click event handler for the unregister button
				view.bindRegisterButton();
				// Enable the button to allow additional click events to be handled
				mare.utils.enableButton($button);
			});

        },

		callEventService: function callEventService(options) {

			$.ajax({
				url: '/services/' + options.service,
				type: 'POST',
				data: {
					eventId: options.eventId
				}
			}).done(function(response) {
				// resolve the appropriate promise showing that registration for the user has changed
				if(options.action === 'register') {

					mare.promises.registered.resolve();

				} else if(options.action === 'unregister') {

					mare.promises.unregistered.resolve();

				}

			}).fail(function(err) {
				// TODO: Show an error message to the user
				console.log(err);
			});
		},

		bindRegisterButton: function bindRegisterButton() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;

			$('.events__register-button').on('click', this.register.bind(view));

		},

		bindUnregisterButton: function bindUnregisterButton() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;

			$('.events__unregister-button').on('click', this.unregister.bind(view));
		},

		unbindRegisterButton: function unbindRegisterButton() {
			// Unbind all events on the register button
			$('.events__register-button').off();

		},

		unbindUnregisterButton: function unbindUnregisterButton() {
			// Unbind all events on the unregister button
			$('.events__unregister-button').off();

		}

	});
}());
