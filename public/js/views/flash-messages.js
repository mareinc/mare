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

			// slide the flash messages into view after 1s
			setTimeout( function() {

				this.mare.views.flashMessages.$flashMessageContainer.addClass( 'slide-in' );
			}, 1000 );
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
