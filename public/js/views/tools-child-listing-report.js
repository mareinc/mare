(function () {
	'use strict';

	mare.views.ChildListingReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .child-listing-search-button' : 'handleSearchClick'
		},

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

			// initialize select inputs
			this.$el.find( '.race-select' ).select2({
				placeholder: 'All Races'
			});

			this.$el.find( '.gender-select' ).select2({
				placeholder: 'All Genders'
			});

			this.$el.find( '.legal-status-select' ).select2({
				placeholder: 'All Statuses'
			});

			this.$el.find( '.placement-status-select' ).select2({
				placeholder: 'All Statuses'
			});

			this.$el.find( '.adoption-worker-region-select' ).select2({
				placeholder: 'All Regions'
            });

			this.$el.find( '.adoption-worker-agency-select' ).select2({
				placeholder: 'All Agencies',
				multiple: true,
				ajax: {
					url: '/tools/services/get-agencies-data',
					dataType: 'json'
				}
			});
			
			this.$el.find( '.adoption-worker-select, .recruitment-worker-select' ).select2({
				placeholder: 'All Social Workers',
				multiple: true,
				ajax: {
					url: '/tools/services/get-social-workers-data',
					dataType: 'json'
				}
			});
		},

		handleSearchClick: function() {

			// get the registration date range for the child listing search
			var registrationDateFrom = this.$el.find( '[name="registrationDateFrom"]' ).val();
			var registrationDateTo = this.$el.find( '[name="registrationDateTo"]' ).val();

			// get the added to web date range for the child listing search
			var webAddedDateFrom = this.$el.find( '[name="webAddedDateFrom"]' ).val();
			var webAddedDateTo = this.$el.find( '[name="webAddedDateTo"]' ).val();

			// collect all values of the form
			var params = this.$el.find( 'form' ).serializeArray();
			
			// remove empty values
			params = _.filter( params, function( value ) {
				return value && value.value && value.value.length > 0 && value.name !== 'childId';
			});

			// build the query string
			var queryString = jQuery.param( params );

			// perform the search
			mare.routers.tools.navigate(
				'child-listing-report/' + 
				registrationDateFrom + '/' + registrationDateTo + '/' +
				webAddedDateFrom + '/' + webAddedDateTo +
				( queryString.length > 0 ? '?' + queryString : '' ), 
				{ trigger: true }
			);
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
				// render the view while the results are being loaded
				view.$el.html( view.template({
					waitingForResults: true
				}));
				view.initializeSearchForm( regDateFrom, regDateTo, webDateFrom, webDateTo, params );

				// search for children using the date range and query params
				view.getChildListingData( regDateFrom, regDateTo, webDateFrom, webDateTo, params )
					.done( function( data ) {

						// render the view with the search results
						view.$el.html( view.template( data ) );
						view.initializeSearchForm( regDateFrom, regDateTo, webDateFrom, webDateTo, params );
					});
			}
		},

		getChildListingData: function( regDateFrom, regDateTo, webDateFrom, webDateTo, params ) {

			var queryParams = params;
			queryParams.regDateFrom = regDateFrom;
			queryParams.regDateTo = regDateTo;
			queryParams.webDateFrom = webDateFrom;
			queryParams.webDateTo = webDateTo;
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-child-listing-data',
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
