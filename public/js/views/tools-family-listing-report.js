(function () {
	'use strict';

	mare.views.FamilyListingReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .family-listing-fiscal-year-button' : 'handleFiscalYearClick'
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
					'All Time': [ moment( '1995-01-01' ), moment() ]
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
			view.$el.html( view.template() );
			
			var defaultFromDate = view.$el.find( '#defaultFromDate' ).val();
			var defaultToDate = view.$el.find( '#defaultToDate' ).val();
			view.initializeSearchForm( defaultFromDate, defaultToDate  );
		}
	});
}());
