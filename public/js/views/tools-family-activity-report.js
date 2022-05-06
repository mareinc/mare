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

        initializeSearchForm: function( fromDate, toDate, params ) {

            // initialize the date range picker
			this.$el.find( '[name="family-activity-date-range"]' ).daterangepicker({
				startDate: moment( fromDate ),
    			endDate: moment( toDate ),
				alwaysShowCalendars: true,
				showDropdowns: true,
				linkedCalendars: false,
                minDate: moment( '2010-01-01' ),
                maxDate: moment().subtract( 1, 'day' ),
				minYear: 2010,
				maxYear: parseInt( moment().format( 'YYYY' ), 10 ),
				ranges: {
					'Last 30 Days': [ moment().subtract( 31, 'days' ), moment() ],
					'Year to Date': [ moment().startOf( 'year' ), moment() ],
					'All Time': [ moment( '2021-06-14' ), moment() ]
				}
			});
        },

        handleSearchClick: function() {},

        handleResetClick: function() {},

        handleXlsxExportClick: function() {},

		render: function( fromDate, toDate, params ) {
			
			var view = this;
            view.$el.html( view.template() );
            view.initializeSearchForm( view.$el.find( '#defaultFromDate' ).val(), view.$el.find( '#defaultToDate' ).val() );
        }
	});
}());
