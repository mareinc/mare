(function () {
	'use strict';

	mare.views.PlacementReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		events: {
			'click .placement-search-button'		: 'handleSearchClick',
			'click .placement-search-reset-button'	: 'handleResetClick'
		},

		initialize: function() {
			
			var toolsPlacementReportTemplate = $( '#tools-placement-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.template = Handlebars.compile( toolsPlacementReportTemplate );
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
			this.$el.find( '.source-select' ).select2({
				placeholder: 'All Sources',
				ajax: {
					url: '/tools/services/get-sources-data',
					dataType: 'json'
				}
			});

			this.$el.find( '.additionalSource-select' ).select2({
				placeholder: 'All Sources',
				ajax: {
					url: '/tools/services/get-sources-data',
					dataType: 'json'
				}
			});

			this.$el.find( '.placementType-select' ).select2({
                placeholder: 'All Placement Types'
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
			mare.routers.tools.navigate( 'placement-report/' + fromDate + '/' + toDate + ( queryString.length > 0 ? '?' + queryString : '' ), { trigger: true } );
		},

		handleResetClick: function() {
			mare.routers.tools.navigate( 'placement-report', { trigger: true } );
		},

		render: function( fromDate, toDate, params ) {

			var view = this;
			view.$el.html( view.template() );
			
			// if the from and to dates are not passed in, initialize the form using the default date range
			if ( !fromDate || !toDate ) {

				view.initializeSearchForm( view.$el.find( '#defaultFromDate' ).val(), view.$el.find( '#defaultToDate' ).val() );
				
			// otherwise, set the from and to dates using the route params and perform a search using the query params
			} else {

				view.initializeSearchForm( fromDate, toDate, params );
			}
		}
	});
}());
