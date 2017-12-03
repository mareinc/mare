(function () {
	'use strict';

	mare.views.AccountSidebar = Backbone.View.extend({
		el: '.sidebar',

		events: {
			'click .account-nav-link': 'announceSelectionChange'
		},

		initialize: function initialize() {
			// create a hook to access the section template
			var html = $( '#account-sidebar' ).html();
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
			// pull the target section from the data attribute of the clicked nav element
			var targetSection = $( event.currentTarget ).data( 'section' );
			// trigger an event so the parent view can handle changing the section
			this.trigger( 'changeSection', targetSection );
		}
	});
}());
