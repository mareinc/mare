(function () {
	'use strict';

	mare.views.FamilyMatching = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .children-search-button'			: 'handleSearchClick',
			'click .children-search-reset-button'	: 'handleResetClick',
			'click .children-export-xlsx-button'	: 'handleXlsxExportClick',
			'click .children-export-pdf-button'	 	: 'handlePDFExportClick',
			'click .save-child-entries-button'		: 'handleSaveChildEntriesClick'
		},

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-family-matching-template' ).html();
			
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
		
		initializeBootstrapToggles: function() {
			this.$el.find( '[data-toggle="toggle"]' ).bootstrapToggle();
		},
		
		/* fills in the form based on parameters */
		initializeTheForm: function( params ) {
			function fillIn() {
				var input = jQuery( this );
				
				if ( input.attr( 'type' ) === 'checkbox' && _.contains( params[ paramName ], input.val() )) {
					input.prop( "checked", true );
				}
				
				if ( input.prop( "tagName" ).toLowerCase() === 'select' ) {
					input.val( params[ paramName ] );
				}
			}
			
			for ( var paramName in params ) {
				if ( params.hasOwnProperty( paramName ) ) {
					this.$el.find( '[name="' + paramName + '"], [name="' + paramName + '[]"]' ).each( fillIn );
				}
			}
		},

		/* render the view onto the page */
		render: function render( familyId, params ) {
			var view = this,
				html;
			
			// display the form based on passed params and wait for the results
			html = view.template( {
				waitingForResults: !_.isEmpty( params )
			});
			view.$el.html( html );
			view.initializeTheForm( params );
			view.initializeAgencySelects();
			view.initializeSocialWorkerSelects();
			view.initializeBootstrapToggles();

			// fetch the data from server and render it
			this.getDataPromise( familyId, params ).done( function( data ) {
				// if there is no parameters in the response (no default parameters) and no results were found
				data.noResultsFound = !data.params && data.results.length === 0;
				// set anonymouse family flag
				data.isAnonymous = data.family._id === 'anonymous';
				
				html = view.template( data );
				view.$el.html( html );
				
				// initialize all form values, if params were sent from the server then this is an initial request without the query string and
				// the form must be initialized using the received set of parameters
				view.initializeTheForm( data.params ? data.params : params );
				
				view.initializeAgencySelects();
				view.initializeSocialWorkerSelects();
				view.initializeBootstrapToggles();
			});
		},
		
		getDataPromise: function( familyId, params ) {
			// append family ID to the params
			params.familyId = familyId;
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-family-matching-data',
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
		},
		
		handleSearchClick: function() {
			var familyId = this.$el.find( '[name="familyId"]' ).val();
			
			// collect all values of the form
			var params = this.$el.find( 'form' ).serializeArray();
			
			// remove empty values and familyId parameter
			params = _.filter( params, function( value ) {
				return value && value.value && value.value.length > 0 && value.name !== 'familyId';
			});
			
			// build the query string
			var queryString = jQuery.param( params );
			
			mare.routers.tools.navigate( 'family-matching/' + familyId + ( queryString.length > 0 ? '?' + queryString : '' ), { trigger: true } );
		},
		
		handleResetClick: function() {
			var familyId = this.$el.find( '[name="familyId"]' ).val();
			
			mare.routers.tools.navigate( 'family-matching/' + familyId, { trigger: true } );
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
			window.open( '/tools/services/get-family-matching-data?' + queryString + '&pdf=1', '_blank' );
		},
		
		handleSaveChildEntriesClick: function() {
			var checkboxes = this.$el.find( '.entry-selection:checked' ),
				ids = checkboxes.map( function() { return $( this ).val() } ).get(),
				familyId = this.$el.find( '[name="familyId"]' ).val();
			
			// collect the POST data
			var postData = {
				ids: ids,
				familyId: familyId
			};
			
			jQuery.post( '/tools/services/save-children-matching-history', postData )
				.done( function( responseData ) {
					// uncheck the checkboxes
					checkboxes.prop( 'checked', false );
					
					// display the flash message
					mare.views.flashMessages.initializeAJAX( responseData.flashMessage );
				})
				.fail( function() {
					console.error( 'Error while saving the entries' );
				});
		}
		
	});
}());
