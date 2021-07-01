(function () {
	'use strict';

	mare.views.CaseloadReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		events: {
			
		},

		initialize: function() {
			
			var toolsCaseloadReportTemplate = $( '#tools-caseload-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.template = Handlebars.compile( toolsCaseloadReportTemplate );
        },

		render: function( fromDate, toDate, params ) {
			
			var view = this;
			view.$el.html( view.template() );
        }
	});
}());
