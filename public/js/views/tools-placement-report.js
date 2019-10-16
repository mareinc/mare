(function () {
	'use strict';

	mare.views.PlacementReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		events: {
			'click .placement-search-button'		: 'handleSearchClick',
			'click .placement-search-reset-button'	: 'handleResetClick',
			'click .placement-export-xlsx-button'	: 'handleXlsxExportClick',
			'click .placement-export-pdf-button'	: 'handlePDFExportClick'
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
			params.push({
				name: 'fromDate',
				value: this.$el.find( '[name="fromDate"]' ).val()
			}, {
				name: 'toDate',
				value: this.$el.find( '[name="toDate"]' ).val()
			});
			
			// build the query string
			var queryString = jQuery.param( params );
			
			// redirect to the PDF report download URL
			window.location = '/tools/services/get-placement-data?' + queryString + '&pdf=1';
		},

		render: function( fromDate, toDate, params ) {

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

				// search for placements using the date range and query params
				view.getPlacementData( fromDate, toDate, params )
					.done( function( data ) {
						// render the view with the search results
						view.$el.html( view.template( data ) );
						view.initializeSearchForm( fromDate, toDate, params );

						// initialize a DataTable for the query results and save a reference on the main
						// dashboard view so it can be destroyed on dashboard view change
						mare.views.tools.table = $('#placement-results').DataTable({
							data: data.results,
							fixedHeader: true,
							pageLength: 100,
							responsive: {
								details: false
							},
							order: [[2, 'asc']],
							dom: 'Bfrtip',
							buttons: [
								'colvis',
								'pageLength'
							],
							columns: [
								{
									title: '',
									data: 'placementId',
									orderable: false,
									render: function( data, type, row ) {
										return '<a href="/keystone/' + row.placementDatabasePath + '/' + data + '"><i class="fa fa-external-link" aria-hidden="true"></i></a>';
									}
								},
								{ 
									title: 'Reg #',
									data: 'childRegistrationNumber',
									render: function( data, type, row, meta ) {
										return row.childId
											? '<a href="/keystone/children/' + row.childId + '">' + data + '</a>'
											: '--';
									}
								},
								{ 
									title: 'First name',
									data: 'childNameFirst' 
								},
								{ 
									title: 'Last Name',
									data: 'childNameLast'
								},
								{
									title: 'Reg Date',
									data: 'childRegistrationDate',
									defaultContent: '--'
								},
								{ 
									title: 'Child SW Region',
									data: 'childSWAgencyRegion',
									defaultContent: '--'
								},
								{
									title: 'Siblings',
									data: function( row ) {
										return row.siblings && row.siblings.length > 0
											? row.siblings.join( ', ')
											: 'None';
									}
								},
								{
									title: 'Reg #',
									data: 'familyRegistrationNumber',
									render: function( data, type, row, meta ) {
										return row.familyId
											? '<a href="/keystone/families/' + row.familyId + '">' + data + '</a>'
											: '--';
									}
								},
								{
									title: 'Contact 1',
									data: 'familyContact1',
									defaultContent: '--'
								},
								{
									title: 'Contact 2',
									data: 'familyContact2',
									defaultContent: '--'
								},
								{
									title: 'Source',
									data: 'source',
									defaultContent: '--'
								},
								{
									title: 'Type',
									data: 'type'
								}
							]
						});
					});
			}
		},

		getPlacementData: function( fromDate, toDate, params ) {
			
			var queryParams = params;
			queryParams.fromDate = fromDate;
			queryParams.toDate = toDate;
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-placement-data',
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
