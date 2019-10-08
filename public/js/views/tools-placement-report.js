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
		
		initializeSearchForm: function( fromDate, toDate, params ) {

			// set the search date range
			this.$el.find( '[name="fromDate"]' ).val( fromDate );
			this.$el.find( '[name="toDate"]' ).val( toDate );
		},

		render: function( fromDate, toDate, params ) {

			var view = this;
			view.$el.html( view.template() );
			
			// if the from and to dates are not passed in, initialize the form using the default date range
			if ( !fromDate || !toDate ) {

				view.initializeSearchForm( view.$el.find( '#defaultFromDate' ).val(), view.$el.find( '#defaultToDate' ).val() );
				
			// otherwise, set the from and to dates using the route params and perform a search using the query params
			} else {

				view.initializeSearchForm( fromDate, toDate, params );
			}
		}
	});
}());
