(function () {
	'use strict';

	mare.views.Form_HaveAQuestion = Backbone.View.extend({
		el: '.form-name',

		initialize: function() {
			// DOM cache any commonly used elements to improve performance

			// Initialize parsley validation on the form
			this.form = this.$el.parsley();
			
			// this.form.on( 'field:validated', this.validateForm );
		},

		validateForm: function validateForm() {
			var ok = $( '.parsley-error' ).length === 0;
			$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
			$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
		}

	});
}());