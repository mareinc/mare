(function () {
	'use strict';

	mare.views.ChildListingReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .child-listing-search-button' 				: 'handleSearchClick',
			'click .child-listing-search-reset-button'			: 'handleResetClick',
			'click .added-to-web-fiscal-year-buttons .btn'		: 'handleFiscalYearClick',
			'click .registration-date-fiscal-year-buttons .btn'	: 'handleFiscalYearClick',
			'click .child-listing-export-xlsx-button'			: 'handleXlsxExportClick',
			'click .child-listing-export-pdf-button'			: 'handlePDFExportClick'
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

			this.$el.find( '.residence-select' ).select2({
				placeholder: 'All Residences'
			});

			this.$el.find( '.physical-needs-select, .emotional-needs-select, .intellectual-needs-select' ).select2({
				placeholder: 'All Levels of Need'
			});

			this.$el.find( '.adoption-worker-region-select, .recruitment-worker-region-select' ).select2({
				placeholder: 'All Regions'
            });

			this.$el.find( '.adoption-worker-agency-select, .recruitment-worker-agency-select' ).select2({
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

		handleFiscalYearClick: function( event ) {
			event.preventDefault();

			// set the search date range on the targeted range fields
			if ( $( event.target ).data( 'target' ) === 'web' ) {
				// the target is the date added to web range
				this.$el.find( '[name="webAddedDateFrom"]' ).val( $( event.target ).data( 'yearStart' ) );
				this.$el.find( '[name="webAddedDateTo"]' ).val( $( event.target ).data( 'yearEnd' ) );
			} else {
				// the traget is the registration date range
				this.$el.find( '[name="registrationDateFrom"]' ).val( $( event.target ).data( 'yearStart' ) );
				this.$el.find( '[name="registrationDateTo"]' ).val( $( event.target ).data( 'yearEnd' ) );
			}
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
				name: 'regDateFrom',
				value: this.$el.find( '[name="registrationDateFrom"]' ).val()
			}, {
				name: 'regDateTo',
				value: this.$el.find( '[name="registrationDateTo"]' ).val()
			}, {
				name: 'webDateFrom',
				value: this.$el.find( '[name="webAddedDateFrom"]' ).val()
			}, {
				name: 'webDateTo',
				value: this.$el.find( '[name="webAddedDateTo"]' ).val()
			});
			
			// build the query string
			var queryString = jQuery.param( params );
			
			// redirect to the PDF report download URL
			window.open( '/tools/services/get-child-listing-data?' + queryString + '&pdf=1', '_blank' );
		},

		handleResetClick: function() {
			mare.routers.tools.navigate( 'child-listing-report', { trigger: true } );
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
				var allTimeFromDate = view.$el.find( '#allTimeFromDate' ).val();
				view.initializeSearchForm( defaultFromDate, defaultToDate, allTimeFromDate, defaultToDate  );

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

						// initialize a DataTable (https://datatables.net/) with the inquiry results
						// save a reference to the table so it can be destroyed when the view changes
						mare.views.tools.table = $('#child-listing-results').DataTable({
							data: data.results, 						// set results data as table source
							columns: view.childListingColumns, 			// configure columns
							order: [[2, 'asc']], 						// define default sort (column index, direction)
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
		},

		childListingColumns: [
			{
				title: 'Reg #',
				data: 'registrationNumber',
				orderable: false,
				render: function( data, type, row, meta ) {
					return '<a href="/keystone/children/' + row.id + '">' + data + '</a>';
				}
			},
			{ title: 'First Name', data: 'firstName' },
			{ title: 'Last Name', data: 'lastName' },
			{ title: 'Gender', data: 'gender' },
			{ title: 'Race', data: 'race' },
			{ title: 'Legal Status', data: 'legalStatus' },
			{ title: 'Placement Status', data: 'placementStatus' },
			{ title: 'Current Age', data: 'currentAge' },
			{ title: 'Adoption Worker', data: 'adoptionWorker' },
			{ title: 'Adoption Worker Region', data: 'adoptionWorkerRegion' },
			{ title: 'Must be placed with siblings?', data: 'mustBePlacedWithSiblings' },
			{ title: 'Siblings to be placed with', data: 'siblingsToBePlacedWith', visible: false },
			{ title: 'Residence', data: 'residence', visible: false },
			{ title: 'Physical Needs', data: 'physicalNeeds', visible: false },
			{ title: 'Emotional Needs', data: 'emotionalNeeds', visible: false },
			{ title: 'Intellectual Needs', data: 'intellectualNeeds', visible: false },
			{ title: 'Age at Registration', data: 'ageAtRegistration', visible: false },
			{ title: 'Registration Date', data: 'registrationDate', visible: false },
			{ title: 'Date Added to Web', data: 'addedToWebDate', visible: false },
			{ title: 'Days Waiting', data: 'daysSinceRegistration', visible: false },
			{ title: 'Professional Photo', data: 'hasPhotolistingPhoto', visible: false },
			{ title: 'Video Snapshot', data: 'hasVideoSnapshot', visible: false },
			{ title: 'Adoptuskids website', data: 'onAdoptuskids', visible: false },
			{ title: 'Wednesday\'s Child', data: 'wednesdaysChild', visible: false },
			{ title: 'Wendy\'s Kids East', data: 'wendysWonderfulKidsCaseloadEast', visible: false },
			{ title: 'Wendy\'s Kids West', data: 'wendysWonderfulKidsCaseloadWest', visible: false },
			{ title: 'Coalition Meeting', data: 'coalitionMeeting', visible: false },
			{ title: 'Matching Event', data: 'matchingEvent', visible: false },
			{ 
				title: 'Display Image',
				data: 'displayImage',
				render: function( data ) {
					return data ? '<a href="' + data + '" target="_blank">Image</a>' : 'No Image';
				},
				visible: false
			}
		]
	});
}());
