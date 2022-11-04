(function () {
	'use strict';

	mare.views.MediaFeaturesReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .media-features-search-button'   			: 'handleSearchClick',
			'click .media-features-search-reset-button'			: 'handleResetClick',
			'click .media-features-export-xlsx-button'			: 'handleXlsxExportClick',
			'click .media-features-export-pdf-button'			: 'handlePDFExportClick',
			'click .media-features-fiscal-year-buttons .btn'	: 'handleFiscalYearClick'
        },

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-media-features-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
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

			// initialize the search date range picker
			this.$el.find( '[name="media-feature-date-range"]' ).daterangepicker({
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
            
            // initialize select inputs
            this.$el.find( '.children-select' ).select2({
				placeholder: 'All Children',
				ajax: {
					url: '/tools/services/get-children-data',
					dataType: 'json'
				}
            });

            this.$el.find( '.source-select' ).select2({
				placeholder: 'All Sources',
				ajax: {
					url: '/tools/services/get-sources-data?sourceType=media',
					dataType: 'json'
				}
			});
        },
        
        handleSearchClick: function() {

			// get the date range for the media feature search
			var $dateRangeInputData = this.$el.find( '[name="media-feature-date-range"]' ).data( 'daterangepicker' );
			var fromDate = $dateRangeInputData.startDate.format( 'YYYY-MM-DD' );
			var toDate = $dateRangeInputData.endDate.format( 'YYYY-MM-DD' );

			// collect all values of the form
			var params = this.$el.find( 'form' ).serializeArray();
			
			// remove empty values & ignore date range values
			params = _.filter( params, function( value ) {
				return value && value.value && value.value.length > 0 && value.name !== 'media-feature-date-range';
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
			mare.routers.tools.navigate( 'media-features-report/' + fromDate + '/' + toDate + ( queryString.length > 0 ? '?' + queryString : '' ), { trigger: true } );
		},

		handleResetClick: function() {
			mare.routers.tools.navigate( 'media-features-report', { trigger: true } );
		},

		handleXlsxExportClick: function() {
			var table = this.$el.find( '.results-table' ),
				wb = XLSX.utils.table_to_book( table[ 0 ] );
				
			// convert HTML table to XLSX file
			XLSX.writeFile( wb, table.data( 'filename' ) );
		},

		handlePDFExportClick: function() {

			// collect the state of the form
			var params = this.$el.find( 'form' ).serializeArray();
			
			// remove empty values
			params = _.filter( params, function( value ) {
				return value && value.value && value.value.length > 0;
			});

			// add the date range to the params
			var $dateRangeInputData = this.$el.find( '[name="media-feature-date-range"]' ).data( 'daterangepicker' );
			params.push({
				name: 'fromDate',
				value: $dateRangeInputData.startDate.format( 'YYYY-MM-DD' )
			}, {
				name: 'toDate',
				value: $dateRangeInputData.endDate.format( 'YYYY-MM-DD' )
			});
			
			// build the query string
			var queryString = jQuery.param( params );
			
			// redirect to the PDF report download URL
			window.open( '/tools/services/get-media-features-data?' + queryString + '&pdf=1', '_blank' );
		},

		handleFiscalYearClick: function( event ) {
			event.preventDefault();

			// set the search date range
			var $dateRangeInputData = this.$el.find( '[name="media-feature-date-range"]' ).data( 'daterangepicker' );
			$dateRangeInputData.setStartDate( moment( $( event.target ).data( 'yearStart' ) ) );
			$dateRangeInputData.setEndDate( moment( $( event.target ).data( 'yearEnd' ) ) );
		},

		/* render the view onto the page */
		render: function render( fromDate, toDate, params ) {
			
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
				
				// search for media features using the date range and query params
				view.getMediaFeaturesData( fromDate, toDate, params )
					.done( function( data ) {

						// render the view with the search results
						view.$el.html( view.template( data ) );
						view.initializeSearchForm( fromDate, toDate, params );

						// initialize a DataTable (https://datatables.net/) with the inquiry results
						// save a reference to the table so it can be destroyed when the view changes
						mare.views.tools.table = $('#media-features-results').DataTable({
							data: data.results, 						// set results data as table source
							columns: view.mediaFeatureReportColumns, 	// configure columns
							order: [[1, 'desc']], 						// define default sort (column index, direction)
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

		getMediaFeaturesData: function( fromDate, toDate, params ) {
			
			var queryParams = params;
			queryParams.fromDate = fromDate;
			queryParams.toDate = toDate;
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-media-features-data',
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

		mediaFeatureReportColumns: [
			{
				title: 'Reg #',
				data: 'childRegistrationNumber',
				orderable: false,
				render: function( data, type, row, meta ) {
					return '<a href="/keystone/children/' + row.childId + '">' + data + '</a>';
				}
			},
			{ title: 'First Name', data: 'childNameFirst' },
			{ title: 'Last Name', data: 'childNameLast' },
			{
				title: 'Status',
				data: 'childStatus',
				render: function( data, type, row, meta ) {
					return data === 'placed'
						? '<div>' + data + '</div><div>(' + row.childPlacementDate + ')</div>'
						: data;
				}
			},
			{ title: 'Source', data: 'mediaFeatureSource' },
			{ 
				title: 'Date', 
				data: function( row, type ) {
					// return date in ISO format to enable column sorting
					return type === 'sort' ? row.mediaFeatureDate.formattedISO : row.mediaFeatureDate.formattedString;
				}
			},
			{ title: 'Professional Photo', data: 'childHasProfessionalPhoto' },
			{ title: 'Video Snapshot', data: 'childHasVideoSnapshot' },
			{ title: 'Avg. Inq. per Month Before Feature', data: 'avgInquiriesBeforeFeature' },
			{ title: 'Inq. the Month After Feature', data: 'inquiriesMonthAfterFeature' },
			{ title: 'Avg. Inq. per Month 6 Months After Feature', data: 'avgInquiriesSixMonthsAfterFeature' }
		]
	});
}());
