(function () {
	'use strict';

	mare.views.FamilyStagesReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-family-stages-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
        },
        
        initializeSearchForm: function( regDateFrom, regDateTo, params ) {

			// initialize the registration date range picker
			this.$el.find( '[name="registration-date-range"]' ).daterangepicker({
				startDate: moment( regDateFrom ),
    			endDate: moment( regDateTo ),
				alwaysShowCalendars: true,
				showDropdowns: true,
				linkedCalendars: false,
				minYear: 2000,
				maxYear: parseInt( moment().format( 'YYYY' ), 10 ),
				ranges: {
					'Last 30 Days': [ moment().subtract( 29, 'days' ), moment() ],
					'Year to Date': [ moment().startOf( 'year' ), moment() ],
					'All Time': [ moment( '2000-01-01' ), moment() ]
				}
            });
		},

		/* render the view onto the page */
		render: function render( regDateFrom, regDateTo, params ) {
			
            var view = this;
            view.$el.html( view.template() );
            var defaultFromDate = view.$el.find( '#defaultFromDate' ).val();
            var defaultToDate = view.$el.find( '#defaultToDate' ).val();
            view.initializeSearchForm( defaultFromDate, defaultToDate  );
			
		}
	});
}());
