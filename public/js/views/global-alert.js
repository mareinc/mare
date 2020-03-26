(function () {
	'use strict';

	mare.views.GlobalAlert = Backbone.View.extend({
		el: '.global-alert',

		events: {
			'click .global-alert__dismiss' : 'dismissAlert'
		},

		initialize: function() {

            // cache the container DOM element
            this.$globalAlertContainer = $( '.global-alert' );

            // if the alert has not been dismissed during the current session
            if ( !sessionStorage.hasDismissedGlobalAlert ) {
                // slide the global alert into view
                this.slideIn();
            }
		},

		// slides the global alert container into view after a specified delay
		slideIn: function( delay ) {

			// set the slide in delay ( in milliseconds ) to a default of 1s if none is specified
			var slideInDelay = delay || 1000;

			// slide the global alert into view
			setTimeout( function() { mare.views.globalAlert.$globalAlertContainer.addClass( 'slide-in' ); }, slideInDelay );
		},

		// remove the global alert
		dismissAlert: function() {
            
            // set the dismissed flag in session storage
            sessionStorage.hasDismissedGlobalAlert = true;

            // slide the global alert out of view
            this.$globalAlertContainer.removeClass( 'slide-in' );
		}
	});
}());
