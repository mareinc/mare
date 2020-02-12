(function () {
	'use strict';

	mare.views.ChildListingReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {},

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-child-listing-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
        },

		/* render the view onto the page */
		render: function render( fromDate, toDate, params ) {
			
            var view = this;
            view.$el.html( view.template() );
		}
	});
}());
