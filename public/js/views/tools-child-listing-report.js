(function () {
	'use strict';

	mare.views.ChildListingReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {},

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-child-listing-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
		},
		
		initializeSearchForm: function( regDateFrom, regDateTo, webDateFrom, webDateTo, params ) {
			
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

			// set the search date ranges
			this.$el.find( '[name="registrationDateFrom"]' ).val( regDateFrom );
			this.$el.find( '[name="registrationDateTo"]' ).val( regDateTo );
			this.$el.find( '[name="webAddedDateFrom"]' ).val( webDateFrom );
			this.$el.find( '[name="webAddedDateTo"]' ).val( webDateTo );
        },

		/* render the view onto the page */
		render: function render( regDateFrom, regDateTo, webDateFrom, webDateTo, params ) {
			
            var view = this;
			view.$el.html( view.template() );
			
			// if the date ranges are not passed in, initialize the form using the default date ranges
			if ( !regDateFrom || !regDateTo || !webDateFrom || !webDateTo ) {

				view.$el.html( view.template() );
				var defaultFromDate = view.$el.find( '#defaultFromDate' ).val();
				var defaultToDate = view.$el.find( '#defaultToDate' ).val();
				view.initializeSearchForm( defaultFromDate, defaultToDate, defaultFromDate, defaultToDate  );

			// otherwise, set the date ranges using the route params and perform a search using the query params
			} else {
				view.initializeSearchForm( regDateFrom, regDateTo, webDateFrom, webDateTo, params );
			}
		}
	});
}());
