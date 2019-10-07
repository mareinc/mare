(function () {
	'use strict';

	mare.views.InquiryReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		events: {
			'click .inquiries-search-button'		: 'handleSearchClick',
			'click .inquiries-search-reset-button'	: 'handleResetClick',
			'click .inquiry-export-xlsx-button'		: 'handleXlsxExportClick',
			'click .inquiry-export-pdf-button'		: 'handlePDFExportClick',
			'click .fiscal-year-buttons .btn'		: 'handleFiscalYearClick'
		},

		initialize: function() {
			
			var toolsInquiryReportTemplate = $( '#tools-inquiry-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.template = Handlebars.compile( toolsInquiryReportTemplate );
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

			this.$el.find( '.children-select' ).select2({
				placeholder: 'All Children',
				ajax: {
					url: '/tools/services/get-children-data',
					dataType: 'json'
				}
            });

			this.$el.find( '.inquirer-select' ).select2({
                placeholder: 'All Inquirers'
			});

			this.$el.find( '.inquiry-method-select' ).select2({
                placeholder: 'All Inquiry Methods'
			});

			this.$el.find( '.inquiry-type-select' ).select2({
				placeholder: 'All Inquiry Types'
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
			mare.routers.tools.navigate( 'inquiry-report/' + fromDate + '/' + toDate + ( queryString.length > 0 ? '?' + queryString : '' ), { trigger: true } );
		},

		handleResetClick: function() {
			mare.routers.tools.navigate( 'inquiry-report', { trigger: true } );
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
			window.location = '/tools/services/get-inquiry-data?' + queryString + '&pdf=1';
		},

		handleFiscalYearClick: function(event) {
			event.preventDefault();

			// set the search date range
			this.$el.find( '[name="fromDate"]' ).val( $(event.target).data('yearStart') );
			this.$el.find( '[name="toDate"]' ).val( $(event.target).data('yearEnd') );
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

				// search for inquiries using the date range and query params
				view.getInquiryData( fromDate, toDate, params )
					.done( function( data ) {
						// render the view with the search results
						view.$el.html( view.template( data ) );
						view.initializeSearchForm( fromDate, toDate, params );

						$('#inquiry-results').DataTable({
							data: data.results,
							columns: [
								{ 
									title: 'Reg #',
									data: 'childRegistrationNumber',
									render: function( data, type, row, meta ) {
										return row.childId
											? '<a href="/keystone/children/' + row.childId + '">' + data + '</a>'
											: '--';
									}
								},
								{ title: 'First Name', data: 'childNameFirst' },
								{ title: 'Last Name', data: 'childNameLast' },
								{ 
									title: 'Child SW Region',
									data: 'childsSWAgencyRegion',
									defaultContent: '--'
								},
								{ title: 'Inquiry Type', data: 'inquiryType' },
								{ title: 'Inquiry Date', data: 'inquiryDate' },
								{ 
									title: 'Reg #',
									data: function( row ) {
										return row.familyRegistrationNumber === '' ? '--' : row.familyRegistrationNumber;
									}
								},
								{ title: 'Contact 1', data: 'familyContact1' },
								{ title: 'Contact 2', data: 'familyContact2' }
							],
							fixedHeader: true,
							order: [[5, 'desc']],
							pageLength: 100,
							responsive: {
								details: false
							},
							dom: 'Bfrtip',
							buttons: [
								'colvis'
							],
							createdRow: function( row, data, index ) {
								var api = this.api();
								api.row(row).child('<tr><td>Row Details</td></tr>').show();
							}
						});
					});
			}
		},

		getInquiryData: function( fromDate, toDate, params ) {
			
			var queryParams = params;
			queryParams.fromDate = fromDate;
			queryParams.toDate = toDate;
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-inquiry-data',
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
