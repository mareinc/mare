(function () {
	'use strict';

	mare.views.FlashMessages = Backbone.View.extend({
		el: '#flash-messages',

		events: {
			'click .alert > div': 'dismissMessage'
		},

		initialize: function() {

			this.$flashMessageContainer = $( '#flash-messages' );

			// slide the flash messages into view after 1s
			setTimeout( function() {

				this.mare.views.flashMessages.$flashMessageContainer.addClass( 'slide-in' );
			}, 1000 );
		},

		// remove a message when the user clicks the close button
		dismissMessage: function( event ) {

			$( event.currentTarget ).remove();
		}
	});
}());
