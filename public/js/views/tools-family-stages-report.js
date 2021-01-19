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

			var view = this;

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
		},

		initializeDateSearchField: function( $el, defaultDateRangeStart, defaultDateRangeEnd ) {

			// initialize the date pickers
			$el.find( '.date-range-picker' )
			
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
				// update the date picker name
				$datePicker.attr( 'name', $datePicker.data( 'fieldName' ) + '-' + searchType );
			});

			// trigger change event to ensure search field is initialized in the correct state
			$dateSearchTypeField.change();
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
