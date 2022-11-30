(function () {
	'use strict';

	mare.views.Dashboard = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .btn-dashboard': 'handleSearchClick',
			'click .family-export-xlsx-button': 'handleXlsxExportClick'
		},

		/* initialize the view */
		initialize: function() {
			var toolsDashboardTemplateHtml = $( '#tools-dashboard-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.dashboardTemplate = Handlebars.compile( toolsDashboardTemplateHtml );
		},

		/* render the view onto the page */
		render: function( fromDate, toDate ) {
			var view = this;

			view.$el.html( '' );
			this.getDataPromise( fromDate, toDate )
				.done( function( data ) {
					var dashboardHtml = view.dashboardTemplate( data );

					view.$el.html( dashboardHtml );

					// initialize the date range picker
					view.$el.find( '[name="dashboard-date-range"]' ).daterangepicker({
						startDate: moment( fromDate ),
						endDate: moment( toDate ),
						alwaysShowCalendars: true,
						showDropdowns: true,
						linkedCalendars: false,
						minYear: 1995,
						maxYear: parseInt( moment().format( 'YYYY' ), 10 ),
						ranges: {
							'Last 30 Days': [ moment().subtract( 29, 'days' ), moment() ],
							'Year to Date': [ moment().startOf( 'year' ), moment() ],
							'All Time': [ moment( '1995-01-01' ), moment() ]
						}
					});
				});
		},
		
		handleSearchClick: function() {

			// get the date range for the dashboard search
			var $dateRangeInputData = this.$el.find( '[name="dashboard-date-range"]' ).data( 'daterangepicker' );
			var fromDate = $dateRangeInputData.startDate.format( 'YYYY-MM-DD' );
			var toDate = $dateRangeInputData.endDate.format( 'YYYY-MM-DD' );

			mare.routers.tools.navigate( 'dashboard/' + fromDate + '/' + toDate, { trigger: true } );
		},
		
		getDataPromise: function( fromDate, toDate ) {
			var queryParams = {};
			
			if ( fromDate && toDate ) {
				queryParams = {
					fromDate: fromDate,
					toDate: toDate
				};
			}
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-dashboard-data',
					data: queryParams,
					type: 'GET'
				})
				.done( function( data ) {
					if ( data.status === 'error' ) {
						// display the flash message
						mare.views.flashMessages.initializeAJAX( data.flashMessage );
						defer.reject();
					} else {
						defer.resolve( data );
					}
				})
				.fail( function( err ) {
					console.log( err );
					defer.reject();
				});
			}).promise();
		},

		handleXlsxExportClick: function() {
			var table = this.$el.find( '.results-table' ),
				wb = XLSX.utils.table_to_book( table[ 0 ] );
				
			// convert HTML table to XLSX file
			XLSX.writeFile( wb, table.data( 'filename' ) );
		}
		
	});
}());
