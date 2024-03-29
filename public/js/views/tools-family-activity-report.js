(function () {
	'use strict';

	mare.views.FamilyActivityReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		events: {
			'click .family-activity-fiscal-year-button'		: 'handleFiscalYearClick',
            'click .family-activity-search-button'			: 'handleSearchClick',
			'click .family-activity-search-reset-button'	: 'handleResetClick',
			'click .family-activity-export-xlsx-button'		: 'handleXlsxExportClick'
        },

		initialize: function() {
			
			var toolsFamilyActivityReportTemplate = $( '#tools-family-activity-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.template = Handlebars.compile( toolsFamilyActivityReportTemplate );
        },

        initializeSearchForm: function( fromDate, toDate, params ) {

			function fillIn() {
				var input = jQuery( this );
						
				if ( input.attr( 'type' ) === 'checkbox' && ( _.contains( params[ paramName ], input.val() ) || params[ paramName ] === input.val() ) ) {
					input.prop( 'checked', true );
				}
				
				if ( input.prop( 'tagName' ).toLowerCase() === 'select' ) {
					input.val( params[ paramName ] );
				}
			}
			
			// seed form fields based on url params
			for ( var paramName in params ) {
				if ( params.hasOwnProperty( paramName ) ) {
					this.$el.find( '[name="' + paramName + '"], [name="' + paramName + '[]"]' ).each( fillIn );
				}
			}

			// initialize select inputs
			this.$el.find( '.region-select' ).select2({
				placeholder: 'All Regions'
			});

			this.$el.find( '.state-select' ).select2({
				placeholder: 'All States'
			});

			this.$el.find( '.gender-select' ).select2({
				placeholder: 'All Genders'
			});

			this.$el.find( '.race-select' ).select2({
				placeholder: 'All Races'
			});

			this.$el.find( '.city-or-town-select' ).select2({
				placeholder: 'All Cities and Towns',
				multiple: true,
				ajax: {
					url: '/tools/services/get-cities-or-towns-data',
					dataType: 'json'
				}
			});

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

			// add results table column visibility settings to params
			var columnVisibilitySettings = mare.views.tools.tableColumnVisibility;
			if ( columnVisibilitySettings && columnVisibilitySettings.length > 0 ) {
				$.each( columnVisibilitySettings, function( index, value ) {
					params.push( { name: 'colVis[]', value: value.columnIndex + '-' + value.visibility } );
				});
			}
			
			// build the query string
			var queryString = jQuery.param( params );

			// perform the search
			mare.routers.tools.navigate( 'family-activity-report/' + fromDate + '/' + toDate + ( queryString.length > 0 ? '?' + queryString : '' ), { trigger: true } );
		},

		handleResetClick: function() {
			mare.routers.tools.navigate( 'family-activity-report', { trigger: true } );
		},

        handleXlsxExportClick: function() {
			var table = this.$el.find( '.results-table' ),
				wb = XLSX.utils.table_to_book( table[ 0 ] );
				
			// convert HTML table to XLSX file
			XLSX.writeFile( wb, table.data( 'filename' ) );
		},

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

						// capture column visibility preference so it can be applied as a query string param on next search
						mare.views.tools.table.on( 'column-visibility.dt', mare.views.tools.handleColumnVisibilityChanged);

						// apply any existing visibility preferences (must happen after event listener is added to persist existing preferences)
						mare.views.tools.applyColumnVisibilityFromParams( params );
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
			{ title: 'Email', data: 'email', defaultContent: '--' },
            { 
				title: 'Account Creation Date', 
				data: function( row, type ) {
					// return date in ISO format to enable column sorting
					return row.registrationDate 
						? type === 'sort' 
							? row.registrationDate.dateISO 
							: row.registrationDate.dateDisplay
						: undefined
				},
				defaultContent: '--'
			},
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
			{ 
				title: 'Latest Placement', 
				data: function( row, type ) {
					// return date in ISO format to enable column sorting
					return row.latestPlacement
						? type === 'sort' 
							? row.latestPlacement.dateISO
							: row.latestPlacement.dateDisplay
						: undefined;
				},
				render: function( data, type, row, meta ) {
					return data ? '<a href="/keystone/placements/' + row.latestPlacement.id + '" target="_blank">' + data + '</a>' : '--';
				}
			},
			{ 
				title: 'Latest Internal Note', 
				data: function( row, type ) {
					// return date in ISO format to enable column sorting
					return row.latestInternalNote
						? type === 'sort' 
							? row.latestInternalNote.dateISO
							: row.latestInternalNote.dateDisplay
						: undefined;
				},
				render: function( data, type, row, meta ) {
					return data ? '<a href="/keystone/internal-notes/' + row.latestInternalNote.id + '" target="_blank">' + data + '</a>' : '--';
				}
			},
			{ 
				title: 'Latest Bookmark', 
				data: function( row, type ) {
					// return date in ISO format to enable column sorting
					return row.latestBookmark
						? type === 'sort' 
							? row.latestBookmark.dateISO
							: row.latestBookmark.dateDisplay
						: undefined;
				},
				render: function( data, type, row, meta ) {
					return data ? '<a href="/keystone/family-histories/' + row.latestBookmark.id + '" target="_blank">' + data + '</a>' : '--';
				}
			}
		]
	});
}());
