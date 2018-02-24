(function () {
	'use strict';

	mare.views.FlashMessages = Backbone.View.extend({
		el: '#flash-messages',

		events: {
		},

		initialize: function() {

			this.$flashMessageContainer = $( '#flash-messages' );

			// slide the flash messages into view after 2s
			setTimeout( function() {

				this.mare.views.flashMessages.$flashMessageContainer.addClass( 'slide-in' );
			}, 1000 );
		}
	});
}());
