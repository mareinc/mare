( function () {
	'use strict';

	mare.views.Tools = Backbone.View.extend({
		el: 'body',
		
		events: {
			'click .export-xlsx-button'	 : 'handleXlsxExportClick',
			'click .export-pdf-button'	 : 'handlePDFExportClick',
			'click .save-entries-button' : 'saveChildEntriesClick',
			'click .save-family-entries-button' : 'saveFamilyEntriesClick'
		},
		
		initialize: function initialize() {
			this.initializeAgencySelects();
			this.initializeSocialWorkerSelects();
			this.initializeFamilySelects();
			this.initializeChildSelects();
		},
		
		initializeAgencySelects: function() {
			this.$el.find('.agency-select').select2({
				placeholder: 'Select agency(ies)',
				multiple: true,
				ajax: {
					url: '/tools/services/get-agencies-data',
					dataType: 'json'
				}
			});
		},
		
		initializeSocialWorkerSelects: function() {
			this.$el.find('.social-worker-select').select2({
				placeholder: 'Select social worker(s)',
				multiple: true,
				ajax: {
					url: '/tools/services/get-social-workers-data',
					dataType: 'json'
				}
			});
		},
		
		initializeFamilySelects: function() {
			this.$el.find('.family-select').select2({
				placeholder: 'Select family',
				ajax: {
					url: '/tools/services/get-families-data',
					dataType: 'json'
				}
			});
		},
		
		initializeChildSelects: function() {
			this.$el.find('.child-select').select2({
				placeholder: 'Select child',
				ajax: {
					url: '/tools/services/get-children-data',
					dataType: 'json'
				}
			});
		},
		
		handleXlsxExportClick: function() {
			var table = this.$el.find( '.results-table' );
			var wb = XLSX.utils.table_to_book( table[ 0 ] );
			XLSX.writeFile(wb, table.data( 'filename' ) );
		},
		
		handlePDFExportClick: function() {
			window.location = window.location.href + '&pdf=1';
		},
		
		saveChildEntriesClick: function() {
			var checkboxes = this.$el.find('.entry-selection:checked');
			var ids = checkboxes.map( function() { return $( this ).val() } ).get();
			if ( ids.length === 0 ) {
				console.error( 'There are no entries selected' );
				return;
			}
			var familyID = this.$el.find('[name="family"]').val();
			if ( !familyID || familyID.length === 0 ) {
				console.error( 'There is no family selected' );
				return;
			}
			
			var postData = {
				ids: ids,
				familyID: familyID
			};
			
			jQuery.post( '/tools/services/save-children-matching-history', postData )
				.done(function() {
					checkboxes.prop('checked', false);
					console.error( "All entries have been saved" );
				})
				.fail(function() {
					console.error( "Error while saving the entries" );
				});
		},
		
		saveFamilyEntriesClick: function() {
			var checkboxes = this.$el.find('.entry-selection:checked');
			var ids = checkboxes.map( function() { return $( this ).val() } ).get();
			if ( ids.length === 0 ) {
				console.error( 'There are no entries selected' );
				return;
			}
			var childID = this.$el.find('[name="child"]').val();
			if ( !childID || childID.length === 0 ) {
				console.error( 'There is no child selected' );
				return;
			}
			
			var postData = {
				ids: ids,
				childID: childID
			};
			
			jQuery.post( '/tools/services/save-families-matching-history', postData )
				.done(function() {
					checkboxes.prop('checked', false);
					console.error( "All entries have been saved" );
				})
				.fail(function() {
					console.error( "Error while saving the entries" );
				});
		}
		
	});
}());
