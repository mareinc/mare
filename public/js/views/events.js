( function () {
	'use strict';

	mare.views.Events = Backbone.View.extend({
		el: 'body',

        events: {
            'click .events__category-card'			: 'navigate',
			'click .events__create-event-button'	: 'navigate',
            'click .events__show-details-button'	: 'navigate',
			'click .events__create-account-button'	: 'navigate',
            'click .events__register-button'		: 'register',
            'click .events__unregister-button'		: 'unregister'
        },
		// TODO: consider putting this in a more global space since it's used for button navigation
        navigate: function navigate( event ) {
        	window.location.href = $( event.currentTarget ).data( 'url' );
        },
		// TODO: There's no need to have a separate register and unregister function, simplify this file
        register: function register() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// Create a promise to resolve once the user has been successfully registered
			mare.promises.registered = $.Deferred();

			var $button = $( event.target );
			// Disable the button to prevent multiple clicks
			mare.utils.disableButton( $button );
			// store the event ID
			var eventId = $button.data( 'event-id' );

			var options = {
				eventId: eventId,
				service: 'register-for-event',
				action: 'register'
			};

			this.callEventService( options );

			// Update the button once the user has been successfully registered
			mare.promises.registered.done( function() {
				// Remove the click event handler for the register button
				view.unbindRegisterButton();
				// Change the button text and apply the correct class
				$button.html( 'Unregister' );
				$button.removeClass( 'events__register-button' ).addClass( 'events__unregister-button' );
				// Add the click event handler for the unregister button
				view.bindUnregisterButton();
				// Enable the button to allow additional click events to be handled
				mare.utils.enableButton( $button );
			});
        },

        unregister: function unregister() {
			// store a reference to this for insde callbacks where context is lost
			var view = this;
			// create a promise to resolve once the user has been successfully unregistered
			mare.promises.unregistered = $.Deferred();

			var $button = $( event.target );
			// disable the button to prevent multiple clicks
			mare.utils.disableButton( $button );
			// store the event ID
			var eventId = $button.data( 'event-id' );

			var options = {
				eventId: eventId,
				service: 'unregister-for-event',
				action: 'unregister'
			};

			this.callEventService( options );

			// update the button once the user has been successfully unregistered
			mare.promises.unregistered.done( function() {
				// remove the click event handler for the register button
				view.unbindUnregisterButton();
				// Change the button text and apply the correct class
				$button.html( 'Register' );
				$button.removeClass( 'events__unregister-button' ).addClass( 'events__register-button' );
				// Add the click event handler for the unregister button
				view.bindRegisterButton();
				// Enable the button to allow additional click events to be handled
				mare.utils.enableButton( $button );
			});

        },

		callEventService: function callEventService( options ) {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;

			$.ajax({
				url: '/services/' + options.service,
				type: 'POST',
				dataType: 'json',
				data: {
					eventId: options.eventId
				}
			}).done( function( response ) {
				// Add the user name to the appropriate list in the DOM
				view.updateAttendeeList( response );

			}).fail( function( err ) {
				// TODO: Show an error message to the user
				console.log(err);
			});
		},

		updateAttendeeList: function updateAttendeeList( response ) {
			// Grab the list of attendees matching the users type
			var $group = $( '.card__list[data-group*="' + response.group + '"]' );

			// resolve the appropriate promise showing that registration for the user has changed
			if(response.action === 'register' ) {
				// Resolve the promise allowing UI actions to reactivate
				mare.promises.registered.resolve();
				// Only edit the DOM if the user is an admin as they're the only users that can see the attendees
				if(response.group === 'admin' ) {
					// TODO: this should be in a template
					// Create the DOM string to add
					var newUserString = '<li class="card__list-item">' + response.name + '</li>';
					// Add the users name to the appropriate list
					$group.append( newUserString );
				}

			} else if(response.action === 'unregister' ) {
				// TODO: This can be cleaned up dramatically by having a separate view for the list component
				// Resolve the promise allowing UI actions to reactivate
				mare.promises.unregistered.resolve();
				// Only edit the DOM if the user is an admin as they're the only users that can see the attendees
				if(response.group === 'admin' ) {
					// Find the DOM element containing the user's name
					var $userElement = $group.find( '.card__list-item' ).filter( ':contains("' + response.name + '")' );
					// Remove the DOM element containing the user's name
					$userElement.remove();
				}
			}
		},

		bindRegisterButton: function bindRegisterButton() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;

			$( '.events__register-button' ).on( 'click', this.register.bind( view ) );

		},

		bindUnregisterButton: function bindUnregisterButton() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;

			$( '.events__unregister-button' ).on( 'click', this.unregister.bind( view ) );
		},

		unbindRegisterButton: function unbindRegisterButton() {
			// Unbind all events on the register button
			$( '.events__register-button' ).off();

		},

		unbindUnregisterButton: function unbindUnregisterButton() {
			// Unbind all events on the unregister button
			$( '.events__unregister-button' ).off();

		}

	});
}());
