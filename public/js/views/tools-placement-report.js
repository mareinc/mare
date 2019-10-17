(function () {
	'use strict';

	mare.views.PlacementReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		events: {
			'click .placement-search-button'			: 'handleSearchClick',
			'click .placement-search-reset-button'		: 'handleResetClick',
			'click .placement-export-xlsx-button'		: 'handleXlsxExportClick',
			'click .placement-export-pdf-button'		: 'handlePDFExportClick',
			'click .placement-fiscal-year-buttons .btn'	: 'handleFiscalYearClick'
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

				// search for placements using the date range and query params
				view.getPlacementData( fromDate, toDate, params )
					.done( function( data ) {
						// render the view with the search results
						view.$el.html( view.template( data ) );
						view.initializeSearchForm( fromDate, toDate, params );

						
						// initialize a DataTable (https://datatables.net/) with the placement results
						// save a reference to the table so it can be destroyed when the view changes
						mare.views.tools.table = $('#placement-results').DataTable({
							data: data.results, 				// set results data as table source
							columns: view.reportGridColumns, 	// configure columns
							order: [[2, 'desc']], 				// define default sort (column index, direction)
							fixedHeader: true, 					// fix the header to the top of the viewport on vertical scroll
							pageLength: 100,					// set default number of rows to display
							responsive: {						// hide columns from right-to-left when the viewport is too narrow
								details: false					// do not display overflow columns in details row (overwrites default content)
							},
							dom: 'Bfrtip',						// define the placement of the grid options (buttons)
							buttons: [
								'pageLength',					// adds toggle for number of rows to display
								{
									extend: 'colvis',			// adds column visibility toggle menu
									columns: ':gt(0)'			// allows toggling of all columns except the first one
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
		},

		reportGridColumns: [
			{
				title: '',
				data: 'placementId',
				orderable: false,
				className: 'icon-link-column',
				render: function( data, type, row ) {
					return '<a href="/keystone/' + row.placementDatabasePath + '/' + data + '"><i class="fa fa-external-link" aria-hidden="true"></i></a>';
				}
			},
			{ title: 'Type', data: 'placementType' },
			{
				title: 'Date',
				data: function( row, type ) {
					// return date in ISO format to enable column sorting
					return type === 'sort' ? row.placementDateISO : row.placementDate;
				}
			},
			{ title: 'Notes', data: 'notes', defaultContent: '' },
			{ title: 'First name', data: 'childNameFirst' },
			{ title: 'Last Name', data: 'childNameLast' },
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
				title: 'Siblings',
				data: function( row ) {
					return row.siblings && row.siblings.length > 0
						? row.siblings.join( ', ')
						: 'None';
				}
			},
			{ title: 'Contact 1', data: 'familyContact1', defaultContent: '--' },
			{ title: 'Contact 2', data: 'familyContact2', defaultContent: '--' },
			{
				title: 'Reg #',
				data: 'familyRegistrationNumber',
				render: function( data, type, row, meta ) {
					return row.familyId
						? '<a href="/keystone/families/' + row.familyId + '">' + data + '</a>'
						: '--';
				}
			},
			{ title: 'Source', data: 'source', defaultContent: '--' },
			{ title: 'Additonal Sources', data: 'additionalSources', defaultContent: '--' },
			// the remaining columns are hidden by default
			{ 
				title: 'Race', 
				data: 'childRace', 
				defaultContent: '--',
				visible: false
			},
			{ 
				title: 'Gender',
				data: 'childGender',
				defaultContent: '--',
				visible: false
			},
			{ 
				title: 'Legal Status',
				data: 'childLegalStatus',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Child SW',
				data: 'childSW',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Child SW Agency',
				data: 'childSWAgency',
				defaultContent: '--',
				visible: false
			},
			{ 
				title: 'Child SW Region',
				data: 'childSWAgencyRegion',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Reg Date',
				data: 'childRegistrationDate',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Days Before Placement',
				data: 'daysBeforePlacement',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Age At Placement',
				data: 'ageAtPlacement',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Physical Needs',
				data: 'childPhysicalNeeds',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Emotional Needs',
				data: 'childEmotionalNeeds',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Intellectual Needs',
				data: 'childIntellectualNeeds',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Social Needs',
				data: 'childSocialNeeds',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Family SW Agency',
				data: 'familySWAgency',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Family Region',
				data: 'familyRegion',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Family Constellation',
				data: 'familyConstellation',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Contact 1 Race',
				data: 'familyContact1Race',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Contact 2 Race',
				data: 'familyContact2Race',
				defaultContent: '--',
				visible: false
			},
			{
				title: 'Registered With MARE',
				data: 'familyRegisteredWithMARE',
				visible: false
			}
		]
	});
}());
