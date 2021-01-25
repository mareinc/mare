(function () {
	'use strict';

	mare.views.FamilyListingReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .family-listing-fiscal-year-button' 	: 'handleFiscalYearClick',
			'click .family-listing-search-button' 		: 'handleSearchClick',
			'click .family-listing-search-reset-button'	: 'handleResetClick',
			'click .family-listing-export-xlsx-button'	: 'handleXlsxExportClick',
			'click .family-listing-export-pdf-button'	: 'handlePDFExportClick'
		},

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-family-listing-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
		},

		initializeSearchForm: function( regDateFrom, regDateTo, params ) {
			
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

			// initialize the registration date range picker
			this.$el.find( '[name="registration-date-range"]' ).daterangepicker({
				startDate: moment( regDateFrom ),
    			endDate: moment( regDateTo ),
				alwaysShowCalendars: true,
				showDropdowns: true,
				linkedCalendars: false,
				minYear: 1995,
				maxYear: parseInt( moment().format( 'YYYY' ), 10 ),
				ranges: {
					'Last 30 Days': [ moment().subtract( 29, 'days' ), moment() ],
					'Year to Date': [ moment().startOf( 'year' ), moment() ],
					'All Time': [ moment( '2000-01-01' ), moment() ]
				}
			});

			// initialize select inputs
			this.$el.find( '.family-constellation-select' ).select2({
				placeholder: 'All Constellations'
			});

			this.$el.find( '.family-region-select' ).select2({
				placeholder: 'All Regions'
			});

			this.$el.find( '.family-state-select' ).select2({
				placeholder: 'All States'
			});

			this.$el.find( '.contact-1-gender-select, .contact-2-gender-select' ).select2({
				placeholder: 'All Genders'
			});

			this.$el.find( '.contact-1-race-select, .contact-2-race-select' ).select2({
				placeholder: 'All Races'
			});

			this.$el.find( '.social-worker-region-select' ).select2({
				placeholder: 'All Regions'
			});
			
			this.$el.find( '.family-services-select' ).select2({
				placeholder: 'All Services'
            });

			this.$el.find( '.social-worker-select' ).select2({
				placeholder: 'All Social Workers',
				multiple: true,
				ajax: {
					url: '/tools/services/get-social-workers-data',
					dataType: 'json'
				}
			});

			this.$el.find( '.social-worker-agency-select' ).select2({
				placeholder: 'All Agencies',
				multiple: true,
				ajax: {
					url: '/tools/services/get-agencies-data',
					dataType: 'json'
				}
			});
		},

		handleSearchClick: function() {

			// get the registration date range for the child listing search
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
				'family-listing-report/' + 
				registrationDateFrom + '/' + registrationDateTo + '/' +
				( queryString.length > 0 ? '?' + queryString : '' ), 
				{ trigger: true }
			);
		},

		handleResetClick: function() {
			mare.routers.tools.navigate( 'family-listing-report', { trigger: true } );
		},

		handleFiscalYearClick: function( event ) {
			event.preventDefault();

			// set the registration date range
			var $dateRangeInputData = this.$el.find( '[name="registration-date-range"]' ).data( 'daterangepicker' );
			$dateRangeInputData.setStartDate( moment( $( event.target ).data( 'yearStart' ) ) );
			$dateRangeInputData.setEndDate( moment( $( event.target ).data( 'yearEnd' ) ) );
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
			var $dateRangeInputData = this.$el.find( '[name="registration-date-range"]' ).data( 'daterangepicker' );
			params.push({
				name: 'regDateFrom',
				value: $dateRangeInputData.startDate.format( 'YYYY-MM-DD' )
			}, {
				name: 'regDateTo',
				value: $dateRangeInputData.endDate.format( 'YYYY-MM-DD' )
			});
			
			// build the query string
			var queryString = jQuery.param( params );
			
			// redirect to the PDF report download URL
			window.open( '/tools/services/get-family-listing-data?' + queryString + '&pdf=1', '_blank' );
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
				view.getFamilyListingData( regDateFrom, regDateTo, params )
					.done( function( data ) {

						// render the view with the search results
						view.$el.html( view.template( data ) );
						view.initializeSearchForm( regDateFrom, regDateTo, params );

						// initialize a DataTable (https://datatables.net/) with the inquiry results
						// save a reference to the table so it can be destroyed when the view changes
						mare.views.tools.table = $('#family-listing-results').DataTable({
							data: data.results, 						// set results data as table source
							columns: view.familyListingColumns, 		// configure columns
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

		getFamilyListingData: function( regDateFrom, regDateTo, params ) {

			var queryParams = params;
			queryParams.regDateFrom = regDateFrom;
			queryParams.regDateTo = regDateTo;
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-family-listing-data',
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

		familyListingColumns: [
			{
				title: 'Reg #',
				data: 'registrationNumber',
				orderable: false,
				render: function( data, type, row, meta ) {
					return '<a href="/keystone/families/' + row.id + '" target="_blank">' + data + '</a>';
				}
			},
			{ title: 'Contact 1', data: 'contact1.fullName', defaultContent: '--' },
			{ title: 'Contact 2', data: 'contact2.fullName', defaultContent: '--' },
			{ title: 'Email', data: 'email',  defaultContent: '--' },
			{ title: 'Current Stage', data: 'currentStage.websiteDisplay', defaultContent: '--'  },
			{ title: 'Constellation', data: 'constellation', defaultContent: '--' },
			{ title: 'Region', data: 'region', defaultContent: '--' },
			{ title: 'State', data: 'state', defaultContent: '--' },
			{ title: 'Social Worker', data: 'socialWorker', defaultContent: '--' },
			{ title: 'SW Agency', data: 'socialWorkerAgency', defaultContent: '--' },
			{ title: 'SW Region', data: 'socialWorkerAgencyRegion', defaultContent: '--' },
			{ title: 'Contact 1 Gender', data: 'contact1.gender', defaultContent: '--' },
			{ title: 'Contact 2 Gender', data: 'contact2.gender', defaultContent: '--' },
			{ title: 'Contact 1 Race(s)', data: 'contact1.race', defaultContent: '--' },
			{ title: 'Contact 2 Race(s)', data: 'contact2.race', defaultContent: '--' },
			{ title: 'Contact 1 Email', data: 'contact1.email', defaultContent: '--', visible: false },
			{ title: 'Contact 2 Email', data: 'contact2.email', defaultContent: '--', visible: false },
			{ title: 'Language', data: 'language', defaultContent: '--', visible: false },
			{ title: 'Other Languages', data: 'otherLanguages', defaultContent: '--', visible: false },
			{ title: 'Num. Children', data: 'numberOfChildren', defaultContent: '--', visible: false },
			{ title: 'Num. Adults', data: 'numberOfAdults', defaultContent: '--', visible: false },
			{ title: 'Homestudy Verified', data: 'isHomestudyVerified', defaultContent: 'false', visible: false }
		]
	});
}());
