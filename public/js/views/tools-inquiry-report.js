(function () {
	'use strict';

	mare.views.InquiryReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		/* initialize the view */
		initialize: function() {
			var toolsInquiryReportTemplate = $( '#tools-inquiry-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.inquiryReportTemplate = Handlebars.compile( toolsInquiryReportTemplate );
		},

		/* render the view onto the page */
		render: function( fromDate, toDate ) {
            var view = this;

            view.$el.html( view.inquiryReportTemplate() );
		}
	});
}());
