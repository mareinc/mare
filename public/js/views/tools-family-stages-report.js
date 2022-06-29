(function () {
	'use strict';

	mare.views.FamilyStagesReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .family-stages-search-button' 		: 'handleSearchClick',
			'click .family-stages-search-reset-button'	: 'handleResetClick',
			'click .family-stages-export-xlsx-button'	: 'handleXlsxExportClick',
			'change input[name="searchType"]'			: 'handleSearchTypeChange'
		},

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-family-stages-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
        },
        
        initializeSearchForm: function( defaultFromDate, defaultToDate, params ) {

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

			// initialize all date search fields
			this.$el.find( '.reporting-date-search-field' ).each( function() {

				var $dateSearchField = $( this );
				// check for a pre-existing value from a previous search
				var preExistingValue = params && params[ $dateSearchField.find( '.date-range-picker' ).attr( 'name' ) ];
				view.initializeDateSearchField( $dateSearchField, moment( defaultFromDate ), moment( defaultToDate ), preExistingValue );
			});

			// initialize required checkboxes
			var searchType = params && params.searchType;
			// set visibility of required field based on search type
			if ( searchType !== 'any' ) {
				this.$el.find( '.field-required' ).hide();
			}

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

		initializeDateSearchField: function( $el, defaultDateRangeStart, defaultDateRangeEnd, preExistingValue ) {
			
			// initilize the search type select
			var $dateSearchTypeField = $el.find( '.date-search-type-select' );
			
			// add change handler
			$dateSearchTypeField.change( function() {
				
				var searchType = $( this ).val();
				var $datePickerContainer = $el.find( '.date-range-picker-container' );
				var $datePicker = $el.find( '.date-range-picker' );
				
				// update date picker visiblity and configuration
				switch ( searchType ) {
					case 'ignore':
						// hide the date picker
						$datePickerContainer.hide();
						break;
					case 'before':
					case 'after':
						// show the picker, configure as a single date
						$datePicker.daterangepicker({
							startDate: preExistingValue ? moment( preExistingValue, 'MM/DD/YYYY' ) : moment(),
							singleDatePicker: true,
							showDropdowns: true,
							minYear: 1995,
							maxYear: parseInt( moment().format( 'YYYY' ), 10 )
						});
						$datePickerContainer.show();
						break;
					case 'between':
						// show the picker, configure as a date range
						var preExistingDates = preExistingValue && preExistingValue.includes( '-' ) && preExistingValue.split( ' - ' );
						$datePicker.daterangepicker({
							startDate: preExistingDates ? moment( preExistingDates[0], 'MM/DD/YYYY' ) : defaultDateRangeStart,
							endDate: preExistingDates ? moment( preExistingDates[1], 'MM/DD/YYYY' ) : defaultDateRangeEnd,
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
						$datePickerContainer.show();
						break;
					default:
						
				}
			});

			// trigger change event to ensure search field is initialized in the correct state
			$dateSearchTypeField.change();
		},

		handleSearchClick: function() {

			// collect all values of the form
			var params = this.$el.find( 'form' ).serializeArray();
			
			// remove empty values and ignore date range values
			params = _.filter( params, function( param ) {
				return param && param.value && param.value.length > 0 && param.value !== 'ignore';
			});

			// build the query string
			// if the query string only includes a single param (searchType) ignore it
			var queryString = jQuery.param( params.length === 1 && params[0].name === 'searchType' ? [] : params );

			// perform the search
			mare.routers.tools.navigate(
				'family-stages-report/' + 
				( queryString.length > 0 ? '?' + queryString : '' ), 
				{ trigger: true }
			);
		},

		handleResetClick: function() {
			mare.routers.tools.navigate( 'family-stages-report', { trigger: true } );
		},

		handleXlsxExportClick: function() {
			var table = this.$el.find( '.results-table' ),
				wb = XLSX.utils.table_to_book( table[ 0 ] );
				
			// convert HTML table to XLSX file
			XLSX.writeFile( wb, table.data( 'filename' ) );
		},

		handleSearchTypeChange: function( event ) {
			
			var searchType = $( event.currentTarget ).val();

			// searchType is 'all'
			if ( searchType === 'all' ) {
				this.$el.find( '.field-required' ).hide();

			// searchType is 'any'
			} else {
				this.$el.find( '.field-required' ).show();
			}
		},

		/* render the view onto the page */
		render: function render( params ) {
			
			var view = this;
			var defaultFromDate = view.$el.find( '#defaultFromDate' ).val();
			var defaultToDate = view.$el.find( '#defaultToDate' ).val();

			// if there are no params defined, initialize the default search form
			if ( Object.keys( params ).length === 0 ) {

				view.$el.html( view.template() );
				view.initializeSearchForm( defaultFromDate, defaultToDate  );

			// otherwise perform a search using the query params
			} else {

				// render the view while the results are being loaded
				view.$el.html( view.template({
					waitingForResults: true
				}));
				view.initializeSearchForm( defaultFromDate, defaultToDate, params );

				// search for families using the date range and query params
				view.getFamilyStagesData( params )
					.done( function( data ) {
						
						// render the view with the search results
						view.$el.html( view.template( data ) );
						view.initializeSearchForm( defaultFromDate, defaultToDate, params );

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
			{ title: 'Contact 2', data: 'contact2.fullName', defaultContent: '--' },
			{ title: 'Oldest Stage', data: 'oldestStage.websiteDisplay', defaultContent: '--' },
			{ title: 'Most Recent Stage', data: 'currentStage.websiteDisplay', defaultContent: '--' },
			{ title: 'Region', data: 'region', defaultContent: '--' },
			{ title: 'State', data: 'state', defaultContent: '--' },
			{ title: 'Constellation', data: 'constellation', defaultContent: '--' },
			{ title: 'Contact 1 Gender', data: 'contact1.gender', defaultContent: '--' },
			{ title: 'Contact 2 Gender', data: 'contact2.gender', defaultContent: '--' },
			{ title: 'Contact 1 Race(s)', data: 'contact1.race', defaultContent: '--' },
			{ title: 'Contact 2 Race(s)', data: 'contact2.race', defaultContent: '--' },
			{ title: 'Contact 1 Email', data: 'contact1.email', defaultContent: '--' },
			{ title: 'Contact 2 Email', data: 'contact2.email', defaultContent: '--' },
			{ title: 'Social Worker', data: 'socialWorker', defaultContent: '--' },
			{ title: 'SW Agency', data: 'socialWorkerAgency', defaultContent: '--' },
			{ title: 'SW Region', data: 'socialWorkerAgencyRegion', defaultContent: '--' },
			{ title: 'Language', data: 'language', defaultContent: '--' },
			{ title: 'Other Languages', data: 'otherLanguages', defaultContent: '--' },
			{ title: 'Num. Children', data: 'numberOfChildren', defaultContent: '--' },
			{ title: 'Num. Adults', data: 'numberOfAdults', defaultContent: '--' },
			{ title: 'Heard About MARE From', data: 'heardAboutMAREFrom', defaultContent: '--' },
			{ title: 'Family Services', data: 'services', defaultContent: '--' },
			{ title: 'Homestudy Verified', data: 'isHomestudyVerified', defaultContent: 'false' },
			{ title: 'Active DB Account', data: 'isActive', defaultContent: 'false' },
			{ title: 'Family Status', data: 'status', defaultContent: '--' },
			{ title: 'Initial Contact Date', data: 'initialContactDate', defaultContent: '--' },
			{ title: 'Homestudy Verified Date', data: 'homestudyVerifiedDate', defaultContent: '--' },
			{ title: 'Info Packet Sent Date', data: 'infoPacketSentDate', defaultContent: '--' },
			{ title: 'Gathering Information Date', data: 'gatheringInformationDate', defaultContent: '--' },
			{ title: 'Looking For Agency Date', data: 'lookingForAgencyDate', defaultContent: '--' },
			{ title: 'Working With Agency Date', data: 'workingWithAgencyDate', defaultContent: '--' },
			{ title: 'MAPP Training Completed Date', data: 'mappTrainingCompletedDate', defaultContent: '--' },
			{ title: 'Homestudy Completed Date', data: 'homestudyCompletedDate', defaultContent: '--' },
			{ title: 'Online Matching Date', data: 'onlineMatchingDate', defaultContent: '--' },
			{ title: 'Registered With MARE Date', data: 'registeredWithMAREDate', defaultContent: '--' },
			{ title: 'Family Profile Created Date', data: 'familyProfileCreatedDate', defaultContent: '--' },
			{ title: 'Closed Date', data: 'closedDate', defaultContent: '--' },
			{ title: 'Account Created Date', data: 'accountCreatedDate', defaultContent: '--' }
		],

		getFamilyStagesData: function( params ) {
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-family-stages-data',
					data: params,
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
