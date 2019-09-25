(function () {
	'use strict';

	mare.views.PlacementReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		initialize: function() {
			
			var toolsPlacementReportTemplate = $( '#tools-placement-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.template = Handlebars.compile( toolsPlacementReportTemplate );
        },

		render: function( fromDate, toDate, params ) {
			
            var view = this;
            view.$el.html( view.template() );
		}
	});
}());
