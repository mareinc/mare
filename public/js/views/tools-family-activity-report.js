(function () {
	'use strict';

	mare.views.FamilyActivityReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		events: {},

		initialize: function() {
			
			var toolsFamilyActivityReportTemplate = $( '#tools-family-activity-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.template = Handlebars.compile( toolsFamilyActivityReportTemplate );
        },

        initializeSearchForm: function( fromDate, toDate, params ) {},

        handleSearchClick: function() {},

        handleResetClick: function() {},

        handleXlsxExportClick: function() {},

		render: function( fromDate, toDate, params ) {
			
			var view = this;
            view.$el.html( view.template() );
        }
	});
}());
