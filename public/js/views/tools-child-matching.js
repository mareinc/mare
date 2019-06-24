(function () {
	'use strict';

	mare.views.ChildMatching = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .families-search-button'			: 'handleSearchClick',
			'click .families-search-reset-button'	: 'handleResetClick',
			'click .export-xlsx-button'				: 'handleXlsxExportClick',
			'click .export-pdf-button'	 			: 'handlePDFExportClick',
			'click .save-family-entries-button'		: 'handleSaveFamilyEntriesClick'
		},

		/* initialize the view */
		initialize: function() {
			var templateHtml = $( '#tools-child-matching-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
		},
		
		initializeAgencySelects: function() {
			this.$el.find( '.agency-select' ).select2({
				placeholder: 'Select agency(ies)',
				multiple: true,
				ajax: {
					url: '/tools/services/get-agencies-data',
					dataType: 'json'
				}
			});
		},
		
		initializeSocialWorkerSelects: function() {
			this.$el.find( '.social-worker-select' ).select2({
				placeholder: 'Select social worker(s)',
				multiple: true,
				ajax: {
					url: '/tools/services/get-social-workers-data',
					dataType: 'json'
				}
			});
		},
		
		initializeTheForm: function( params ) {
			// fill the form based on parameters
			for ( var paramName in params ) {
				this.$el.find( '[name="' + paramName + '"], [name="' + paramName + '[]"]' ).each( function() {
					var input = jQuery( this );
					
					if ( input.attr( 'type' ) == 'checkbox' && _.contains( params[ paramName ], input.val() )) {
						input.prop( "checked", true );
					}
					
					if ( input.prop( "tagName" ).toLowerCase() == 'select' ) {
						input.val( params[ paramName ] );
					}
				});
			}
		},
		
		handleSearchClick: function() {
			var childID = this.$el.find( '[name="childID"]' ).val();
			
			// collect all values of the form
			var params = this.$el.find( 'form' ).serializeArray();
			
			// remove empty values
			params = _.filter( params, function( value ) {
				return value && value.value && value.value.length > 0;
			});
			
			// build the query string
			var queryString = jQuery.param( params );
			
			mare.routers.tools.navigate( 'child-matching/' + childID + ( queryString.length > 0 ? '?' + queryString : '' ), { trigger: true } );
		},
		
		handleResetClick: function() {
			var childID = this.$el.find( '[name="childID"]' ).val();
			
			mare.routers.tools.navigate( 'child-matching/' + childID, { trigger: true } );
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
			
			// build the query string
			var queryString = jQuery.param( params );
			
			// redirect to the PDF report download URL
			window.location = '/tools/services/get-child-matching-data?' + queryString + '&pdf=1';
		},
		
		handleSaveFamilyEntriesClick: function() {
			var checkboxes = this.$el.find( '.entry-selection:checked' ),
				ids = checkboxes.map( function() { return $( this ).val() } ).get(),
				childID = this.$el.find( '[name="childID"]' ).val();
			
			// collect the POST data
			var postData = {
				ids: ids,
				childID: childID
			};
			
			jQuery.post( '/tools/services/save-families-matching-history', postData )
				.done( function( responseData ) {
					// uncheck the checkboxes
					checkboxes.prop( 'checked', false );
					
					// display the flash message
					mare.views.flashMessages.initializeAJAX( responseData.flashMessage );
				})
				.fail( function() {
					console.error( 'Error while saving the entries' );
				});
		},

		render: function( childID, params ) {
			var view = this;
			
			view.$el.html( '' );
			this.getDataPromise( childID, params ).done( function( data ) {
				var html = view.template( data );

				view.$el.html( html );
				view.initializeAgencySelects();
				view.initializeSocialWorkerSelects();
				
				// initialize all form values, if params were send from the server then this is an initial request without the query string and
				// the form should be initialized using the received set of parameters
				view.initializeTheForm( data.params ? data.params : params );
			});
		},
		
		getDataPromise: function( childID, params ) {
			// append child ID to the params
			params.childID = childID;
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-child-matching-data',
					data: params,
					type: 'GET'
				}).done( function( data ) {
					if ( data.status === 'error' ) {
						mare.views.flashMessages.initializeAJAX( data.flashMessage );
						defer.reject();
					} else {
						defer.resolve( data );
					}
				}).fail( function( err ) {
					console.log( err );
					defer.reject();
				});
			}).promise();
		}
		
	});
}());
