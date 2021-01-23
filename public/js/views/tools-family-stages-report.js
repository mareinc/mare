(function () {
	'use strict';

	mare.views.FamilyStagesReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .family-stages-fiscal-year-button' 	: 'handleFiscalYearClick',
			'click .family-stages-search-button' 		: 'handleSearchClick',
			'click .family-stages-search-reset-button'	: 'handleResetClick'
		},

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-family-stages-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
        },
        
        initializeSearchForm: function( regDateFrom, regDateTo, params ) {

			var view = this;

			function fillIn() {
				var input = jQuery( this );
						
				if ( input.attr( 'type' ) === 'checkbox' || input.attr( 'type' ) === 'radio' && ( _.contains( params[ paramName ], input.val() ) || params[ paramName ] === input.val() ) ) {
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

			// initialize all date search fields
			this.$el.find( '.reporting-date-search-field' ).each( function() {
				view.initializeDateSearchField( $( this ), moment( regDateFrom ), moment( regDateTo ) );
			});

			// initialize select inputs
			this.$el.find( '.family-state-select' ).select2({
				placeholder: 'All States'
			});

			this.$el.find( '.family-region-select' ).select2({
				placeholder: 'All Regions'
			});

			this.$el.find( '.family-status-select' ).select2({
				placeholder: 'All Statuses'
			});
		},

		initializeDateSearchField: function( $el, defaultDateRangeStart, defaultDateRangeEnd ) {
			
			// initilize the search type select
			var $dateSearchTypeField = $el.find( '.date-search-type-select' );
			
			// add change handler
			$dateSearchTypeField.change( function() {
				
				var searchType = $( this ).val();
				var $datePicker = $el.find( '.date-range-picker' );
				
				// update date picker visiblity and configuration
				switch ( searchType ) {
					case 'ignore':
						// hide the date picker
						$datePicker.hide();
						break;
					case 'before':
					case 'after':
						// show the picker, configure as a single date
						$datePicker.daterangepicker({
							singleDatePicker: true,
							showDropdowns: true,
							minYear: 2000,
							maxYear: parseInt( moment().format( 'YYYY' ), 10 )
						});
						$datePicker.show();
						break;
					case 'between':
						// show the picker, configure as a date range
						$datePicker.daterangepicker({
							startDate: defaultDateRangeStart,
							endDate: defaultDateRangeEnd,
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
						$datePicker.show();
						break;
					default:
						
				}
			});

			// trigger change event to ensure search field is initialized in the correct state
			$dateSearchTypeField.change();
		},

		handleSearchClick: function() {

			// get the registration date range for the child stages search
			var $dateRangeInputData = this.$el.find( '[name="registration-date-range"]' ).data( 'daterangepicker' );
			var registrationDateFrom = $dateRangeInputData.startDate.format( 'YYYY-MM-DD' );
			var registrationDateTo = $dateRangeInputData.endDate.format( 'YYYY-MM-DD' );

			// collect all values of the form
			var params = this.$el.find( 'form' ).serializeArray();
			
			// remove empty values and ignore date range values
			params = _.filter( params, function( value ) {
				return value && value.value && value.value.length > 0 && value.name !== 'registration-date-range';
			});

			// build the query string
			var queryString = jQuery.param( params );

			// perform the search
			mare.routers.tools.navigate(
				'family-stages-report/' + 
				registrationDateFrom + '/' + registrationDateTo + '/' +
				( queryString.length > 0 ? '?' + queryString : '' ), 
				{ trigger: true }
			);
		},

		handleResetClick: function() {
			mare.routers.tools.navigate( 'family-stages-report', { trigger: true } );
		},

		handleFiscalYearClick: function( event ) {
			event.preventDefault();

			// set the registration date range
			var $dateRangeInputData = this.$el.find( '[name="registration-date-range"]' ).data( 'daterangepicker' );
			$dateRangeInputData.setStartDate( moment( $( event.target ).data( 'yearStart' ) ) );
			$dateRangeInputData.setEndDate( moment( $( event.target ).data( 'yearEnd' ) ) );
		},

		/* render the view onto the page */
		render: function render( regDateFrom, regDateTo, params ) {
			
            var view = this;

			// if the date ranges are not passed in, initialize the form using the default date ranges
			if ( !regDateFrom || !regDateTo ) {

				view.$el.html( view.template() );
				var defaultFromDate = view.$el.find( '#defaultFromDate' ).val();
				var defaultToDate = view.$el.find( '#defaultToDate' ).val();
				view.initializeSearchForm( defaultFromDate, defaultToDate  );

			// otherwise, set the date ranges using the route params and perform a search using the query params
			} else {
				// render the view while the results are being loaded
				view.$el.html( view.template({
					waitingForResults: true
				}));
				view.initializeSearchForm( regDateFrom, regDateTo, params );

				// search for families using the date range and query params
				view.getFamilyStagesData( regDateFrom, regDateTo, params )
					.done( function( data ) {
						
						// render the view with the search results
						view.$el.html( view.template( data ) );
						view.initializeSearchForm( regDateFrom, regDateTo, params );

						// initialize a DataTable (https://datatables.net/) with the inquiry results
						// save a reference to the table so it can be destroyed when the view changes
						mare.views.tools.table = $('#family-stages-results').DataTable({
							data: data.results, 						// set results data as table source
							columns: view.familyStagesColumns, 			// configure columns
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

		familyStagesColumns: [
			{
				title: 'Reg #',
				data: 'registrationNumber',
				orderable: false,
				render: function( data, type, row, meta ) {
					return '<a href="/keystone/families/' + row.id + '" target="_blank">' + data + '</a>';
				}
			},
			{ title: 'Email', data: 'email',  defaultContent: '--' },
			{ title: 'Contact 1', data: 'contact1.fullName', defaultContent: '--' },
			{ title: 'Contact 2', data: 'contact2.fullName', defaultContent: '--' }
		],

		getFamilyStagesData: function( regDateFrom, regDateTo, params ) {

			var queryParams = params;
			queryParams.regDateFrom = regDateFrom;
			queryParams.regDateTo = regDateTo;
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-family-stages-data',
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
		}
	});
}());
