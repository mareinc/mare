(function () {
	'use strict';

	mare.views.AccountMobileSidebar = Backbone.View.extend({
		el: '.mobile-account-nav-container',

		events: {
			'change .mobile-account-nav': 'announceSelectionChange'
		},

		initialize: function initialize() {
			// create a hook to access the section template
			var html = $( '#account-mobile-sidebar' ).html();
			// compile the templates to be used during rendering/repainting the different sections
			this.template = Handlebars.compile( html );
		},

		render: function render( route ) {
			// compile the template
			var html = this.template( { selectedRoute: route } );
			// render the template to the page
			this.$el.html( html );
		},

		announceSelectionChange: function announceSelectionChange( event ) {
			// trigger an event so the router knows to update the url
			this.trigger( 'changeSection', event.currentTarget.value );
		}
	});
}());