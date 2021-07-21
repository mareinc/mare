(function () {
	'use strict';

	mare.views.CaseloadReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		events: {
			'click .caseload-search-button' : 'handleSearchClick'
		},

		initialize: function() {
			
			var toolsCaseloadReportTemplate = $( '#tools-caseload-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.template = Handlebars.compile( toolsCaseloadReportTemplate );
        },

        initializeSearchForm: function( fromDate, toDate, params ) {

            // initialize the date range picker
			this.$el.find( '[name="caseload-date-range"]' ).daterangepicker({
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
        },

        handleSearchClick: function() {

			// get the date range for the inquiry search
			var $dateRangeInputData = this.$el.find( '[name="caseload-date-range"]' ).data( 'daterangepicker' );
			var fromDate = $dateRangeInputData.startDate.format( 'YYYY-MM-DD' );
			var toDate = $dateRangeInputData.endDate.format( 'YYYY-MM-DD' );

			// collect all values of the form
			var params = this.$el.find( 'form' ).serializeArray();
			
			// remove empty values
			params = _.filter( params, function( value ) {
				return value && value.value && value.value.length > 0 && value.name !== 'caseload-date-range';
			});
			
			// build the query string
			var queryString = jQuery.param( params );

			// perform the search
			mare.routers.tools.navigate( 'caseload-report/' + fromDate + '/' + toDate + ( queryString.length > 0 ? '?' + queryString : '' ), { trigger: true } );
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

                view.getCaseloadData( fromDate, toDate, params )
                    .done( function( data ) {

                        // render the view with the search results
                        view.$el.html( view.template( data ) );
                        view.initializeSearchForm( fromDate, toDate, params );

                        // initialize a DataTable (https://datatables.net/) with the inquiry results
                        // save a reference to the table so it can be destroyed when the view changes
                        mare.views.tools.table = $('#caseload-results').DataTable({
                            data: data.results, 				// set results data as table source
                            columns: view.reportGridColumns, 	// configure columns
                            order: [[0, 'asc']], 				// define default sort (column index, direction)
                            fixedHeader: true, 					// fix the header to the top of the viewport on vertical scroll
                            pageLength: 100,					// set default number of rows to display
                            responsive: {						// hide columns from right-to-left when the viewport is too narrow
                                details: false					// do not display overflow columns in details row (overwrites default content)
                            },
                            dom: 'Bfrtip',						// define the placement of the grid options (buttons)
                            buttons: [
                                'pageLength',					// adds toggle for number of rows to display
                                {
                                    extend: 'colvis',			// adds column visibility toggle menu
                                    columns: ':gt(0)'			// allows toggling of all columns except the first one
                                }
                            ]
                        });
                    });
            }
        },

        getCaseloadData: function( fromDate, toDate, params ) {
			
			var queryParams = params;
			queryParams.fromDate = fromDate;
			queryParams.toDate = toDate;
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-caseload-data',
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

        reportGridColumns: [
			{
				title: 'Date',
				data: 'date',
				defaultContent: '--'
			},
            {
                title: 'Active Caseload',
                data: 'totalActiveCases',
				defaultContent: '--'
            },
            {
                title: 'Total Visible Profiles',
                data: 'totalVisibleProfiles',
				defaultContent: '--'
            },
            {
                title: 'Active Caseload - Boston',
                data: 'regionalCounts.boston.childCounts.active',
				defaultContent: '--'
            },
            {
                title: 'Active Caseload - Northern',
                data: 'regionalCounts.northern.childCounts.active',
				defaultContent: '--'
            },
            {
                title: 'Active Caseload - Southern',
                data: 'regionalCounts.southern.childCounts.active',
				defaultContent: '--'
            },
            {
                title: 'Active Caseload - Western',
                data: 'regionalCounts.western.childCounts.active',
				defaultContent: '--'
            },
            {
                title: 'Active Caseload - Central',
                data: 'regionalCounts.central.childCounts.active',
				defaultContent: '--'
            },
            {
                title: 'Active Caseload - Out of State',
                data: 'regionalCounts.outOfState.childCounts.active',
				defaultContent: '--'
            },
            {
                title: 'Active Caseload - Specialized',
                data: 'regionalCounts.specialized.childCounts.active',
				defaultContent: '--'
            }
		]
	});
}());
