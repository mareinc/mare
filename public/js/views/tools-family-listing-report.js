(function () {
	'use strict';

	mare.views.FamilyListingReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-family-listing-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
		},

		/* render the view onto the page */
		render: function render( regDateFrom, regDateTo, params ) {
			
            var view = this;
            view.$el.html( view.template() );
		}
	});
}());
