(function () {
	'use strict';

	mare.views.MediaFeaturesReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .media-features-search-button'   			: 'handleSearchClick',
			'click .media-features-search-reset-button'			: 'handleResetClick',
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

			// set the search date range
			this.$el.find( '[name="fromDate"]' ).val( fromDate );
            this.$el.find( '[name="toDate"]' ).val( toDate );
            
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
					url: '/tools/services/get-sources-data',
					dataType: 'json'
				}
			});
        },
        
        handleSearchClick: function() {

			// get the date range for the inquiry search
			var fromDate = this.$el.find( '[name="fromDate"]' ).val();
			var toDate = this.$el.find( '[name="toDate"]' ).val();

			// collect all values of the form
			var params = this.$el.find( 'form' ).serializeArray();
			
			// remove empty values
			params = _.filter( params, function( value ) {
				return value && value.value && value.value.length > 0 && value.name !== 'childId';
			});
			
			// build the query string
			var queryString = jQuery.param( params );

			// perform the search
			mare.routers.tools.navigate( 'media-features-report/' + fromDate + '/' + toDate + ( queryString.length > 0 ? '?' + queryString : '' ), { trigger: true } );
		},

		handleResetClick: function() {
			mare.routers.tools.navigate( 'media-features-report', { trigger: true } );
		},

		handleFiscalYearClick: function( event ) {
			event.preventDefault();

			// set the search date range
			this.$el.find( '[name="fromDate"]' ).val( $(event.target).data('yearStart') );
			this.$el.find( '[name="toDate"]' ).val( $(event.target).data('yearEnd') );
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
                view.initializeSearchForm( fromDate, toDate );
            }
		}
		
	});
}());
