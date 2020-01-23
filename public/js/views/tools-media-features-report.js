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
			{ title: 'Inquiries per Month Before Feature', data: 'avgInquiriesBeforeFeature' },
			{ title: 'Inquiries the Month After Feature', data: 'inquiriesMonthAfterFeature' },
			{ title: 'Inquiries per Month After Feature', data: 'avgInquiriesAfterFeature' }
		]
	});
}());
