(function () {
	'use strict';

	mare.views.FamilyMatching = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			
		},

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-family-matching-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
		},

		/* render the view onto the page */
		render: function render( familyID, params ) {
			var html = this.template( { } );

			this.$el.html( html );
		}
		
	});
}());
