(function () {
	'use strict';

	mare.views.ChildRegistration = Backbone.View.extend({
		el: '.social-worker-child-registration-container',

		initialize: function() {
			mare.views.createChild = mare.views.createChild || new mare.views.CreateChild();
			
			if( this.$( '.edit-child-form-container' ).length ) {
				mare.views.editChild = mare.views.editChild || new mare.views.EditChild();
			}
		},

		showCreateChildForm: function showCreateChildForm() {
			this.$( '.create-child-form-container' ).removeClass( 'hidden' );
			this.$( '.edit-child-form-container' ).addClass( 'hidden' );
		},

		showEditChildForm: function showEditChildForm() {
			this.$( '.edit-child-form-container' ).removeClass( 'hidden' );
			this.$( '.create-child-form-container' ).addClass( 'hidden' );
		}
	});
}());