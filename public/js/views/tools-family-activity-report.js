(function () {
	'use strict';

	mare.views.FamilyActivityReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		events: {
			'click .family-activity-fiscal-year-button'		: 'handleFiscalYearClick',
            'click .family-activity-search-button'			: 'handleSearchClick'
        },

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

        handleSearchClick: function() {

			// get the date range for the family activity search
			var $dateRangeInputData = this.$el.find( '[name="family-activity-date-range"]' ).data( 'daterangepicker' );
			var fromDate = $dateRangeInputData.startDate.format( 'YYYY-MM-DD' );
			var toDate = $dateRangeInputData.endDate.format( 'YYYY-MM-DD' );

			// collect all values of the form
			var params = this.$el.find( 'form' ).serializeArray();
			
			// remove empty values
			params = _.filter( params, function( value ) {
				return value && value.value && value.value.length > 0 && value.name !== 'family-activity-date-range';
			});
			
			// build the query string
			var queryString = jQuery.param( params );

			// perform the search
			mare.routers.tools.navigate( 'family-activity-report/' + fromDate + '/' + toDate + ( queryString.length > 0 ? '?' + queryString : '' ), { trigger: true } );
		},

        handleResetClick: function() {},

        handleXlsxExportClick: function() {},

		handleFiscalYearClick: function( event ) {
			event.preventDefault();

			// set the registration date range
			var $dateRangeInputData = this.$el.find( '[name="family-activity-date-range"]' ).data( 'daterangepicker' );
			$dateRangeInputData.setStartDate( moment( $( event.target ).data( 'yearStart' ) ) );
			$dateRangeInputData.setEndDate( moment( $( event.target ).data( 'yearEnd' ) ) );
		},

		render: function( fromDate, toDate, params ) {
			
			var view = this;
			
			// if the from and to dates are not passed in, initialize the form using the default date range
			if ( !fromDate || !toDate ) {

				view.$el.html( view.template() );
				view.initializeSearchForm( view.$el.find( '#defaultFromDate' ).val(), view.$el.find( '#defaultToDate' ).val() );
				
			// otherwise, set the from and to dates using the route params and perform a search using the query params
			} else {

                // render the view while the results are being loaded
				view.$el.html( view.template({
					waitingForResults: true
				}));
				view.initializeSearchForm( fromDate, toDate, params );

                view.getFamilyActivityData( fromDate, toDate, params )
                    .done( function( data ) {
                        
                        // render the view with the search results
                        view.$el.html( view.template( data ) );
                        view.initializeSearchForm( fromDate, toDate, params );

                        // initialize a DataTable (https://datatables.net/) with the inquiry results
						// save a reference to the table so it can be destroyed when the view changes
						mare.views.tools.table = $('#family-activity-results').DataTable({
							data: data.results, 						// set results data as table source
							columns: view.familyActivityColumns, 			// configure columns
							order: [[0, 'asc']], 						// define default sort (column index, direction)
							fixedHeader: true, 							// fix the header to the top of the viewport on vertical scroll
							pageLength: 100,							// set default number of rows to display
							responsive: {								// hide columns from right-to-left when the viewport is too narrow
								details: false							// do not display overflow columns in details row (overwrites default content)
							},
							dom: 'Bfrtip',								// define the placement of the grid options (buttons)
							buttons: [
								'pageLength',							// adds toggle for number of rows to display
								{
									extend: 'colvis',					// adds column visibility toggle menu
									columns: ':gt(0)'					// allows toggling of all columns except the first one
								}
							]
						});
                    });
            }
        },

        getFamilyActivityData: function( fromDate, toDate, params ) {
			
			var queryParams = params;
			queryParams.fromDate = fromDate;
			queryParams.toDate = toDate;
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-family-activity-data',
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

        familyActivityColumns: [
			{
				title: 'Reg #',
				data: 'registrationNumber',
				orderable: false,
				render: function( data, type, row, meta ) {
					return '<a href="/keystone/families/' + row.id + '" target="_blank">' + data + '</a>';
				}
			},
			{ title: 'Email', data: 'email',  defaultContent: '--' },
            { title: 'Registration Date', data: 'registrationDate', defaultContent: '--' },
            { 
				title: 'Latest Inquiry', 
				data: function( row, type ) {
					// return date in ISO format to enable column sorting
					return row.latestInquiry 
						? type === 'sort' 
							? row.latestInquiry.dateISO 
							: row.latestInquiry.dateDisplay
						: undefined
				},
				render: function( data, type, row, meta ) {
					return data ? '<a href="/keystone/inquiries/' + row.latestInquiry.id + '" target="_blank">' + data + '</a>' : '--';
				}
			},
			{ 
				title: 'Latest Event Attended', 
				data: function( row, type ) {
					// return date in ISO format to enable column sorting
					return row.latestEvent
						? type === 'sort' 
							? row.latestEvent.dateISO
							: row.latestEvent.dateDisplay
						: undefined;
				},
				render: function( data, type, row, meta ) {
					return data ? '<a href="/keystone/events/' + row.latestEvent.id + '" target="_blank">' + data + '</a>' : '--';
				}
			},
			{ 
				title: 'Latest Match', 
				data: function( row, type ) {
					// return date in ISO format to enable column sorting
					return row.latestMatch
						? type === 'sort' 
							? row.latestMatch.dateISO
							: row.latestMatch.dateDisplay
						: undefined;
				},
				render: function( data, type, row, meta ) {
					return data ? '<a href="/keystone/matches/' + row.latestMatch.id + '" target="_blank">' + data + '</a>' : '--';
				}
			},
			{ title: 'Latest Placement', data: 'latestPlacementDate', defaultContent: '--' },
            { title: 'Latest Note', data: 'latestNoteDate', defaultContent: '--' }
		]
	});
}());
