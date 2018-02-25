(function () {
	'use strict';

	mare.views.FlashMessages = Backbone.View.extend({
		el: '#flash-messages',

		events: {
			'click .alert > div': 'dismissMessage'
		},

		initialize: function() {

			// cache DOM elements
			this.$flashMessageContainer = $( '#flash-messages' );

			// set the max-height of each message on the page
			this.setMaxHeights();

			// if there are any messages to display
			if ( this.$flashMessageContainer.children().length > 0 ) {

				// slide the flash message container into view
				this.slideIn();
			}
		},

		// initialize flash messages based on AJAX actions ( e.g. form submissions )
		initializeAJAX: function( flashMessageMarkup ) {

			// if the flash message container is already in view
			if ( this.$flashMessageContainer.hasClass( 'slide-in' ) ) {

				// ensure the flash message container is not already in view
				mare.views.flashMessages.$flashMessageContainer.removeClass( 'slide-in' );

				// wait until the flash message container has been slid out of view
				mare.views.flashMessages.$flashMessageContainer.on( 'transitionend', function( event ) {

					// remove the transitionend handler
					mare.views.flashMessages.$flashMessageContainer.off( 'transitionend' );

					// remove all of the messages from the flash message container
					mare.views.flashMessages.$flashMessageContainer.empty();

					// append and show any messages
					mare.views.flashMessages.appendAndShowAJAXMessages( flashMessageMarkup );
				});

			// if the flash message container is not in view
			} else {

				// append and show any messages
				this.appendAndShowAJAXMessages( flashMessageMarkup );
			}
		},

		// append any AJAX flash messages and slid the messages into view
		appendAndShowAJAXMessages: function( flashMessageMarkup ) {

			// iterate over each message in the generated flash message markup
			$( flashMessageMarkup ).find( '.alert' ).each( function() {

				// append each message to the flash message container
				mare.views.flashMessages.$flashMessageContainer.append( this );
			});

			// set the max-height of each message on the page
			this.setMaxHeights();

			// slide the flash message container into view
			this.slideIn( 500 );
		},

		// slides the flash messages container into view after a specified delay
		slideIn: function( delay ) {

			// set the slide in delay ( in milliseconds ) to a default of 1s if none is specified
			var slideInDelay = delay || 1000;

			// slide the flash messages into view
			setTimeout( function() { mare.views.flashMessages.$flashMessageContainer.addClass( 'slide-in' ); }, slideInDelay );
		},

		// remove a message when the user clicks the close button
		dismissMessage: function( event ) {

			// begin the slide-up transition to remove the message
			$( event.currentTarget ).addClass( 'slide-up' );
		},

		// sets the max-height of each message dynamically based on its content
		setMaxHeights: function() {

			// get a list of all the messages on the page
			var $messages = $( '.alert > div' );

			// iterate over each message
			$messages.each( function() {

				// set the max-height to the height that the element rendered at automatically
				var $message = $( this );
				$message.css( 'max-height', $message.height() );

				// add a transitionend event listener that will fire when the message is done being removed
				$message.on( 'transitionend', function( event ) {

					// get the removed message from the event details
					var $removedMessage = $( event.currentTarget );
					// store a reference to the message container
					var $messageContainer = $removedMessage.parent();

					// remove the message DOM and unbind all event listeners
					$removedMessage.remove();

					// check to see if the removed message was the last message in the container
					if ( $messageContainer.children().length === 0 ) {

						// if so, slide up the container padding
						$messageContainer.addClass( 'slide-up-padding' );
					}
				});
			});
		}
	});
}());
