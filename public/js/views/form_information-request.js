(function () {
	'use strict';

	mare.views.Form_InformationRequest = Backbone.View.extend({
		el: '.form--information-request',

		// TODO: show registration numbers only for child registration
		events: {
			'change .interest': 'toggleChildRegistrationNumbersInput'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$interest = $( '.interest' );
			this.$childRegistrationNumbersContainer = $( '.child-registration-numbers-container' );

			// Initialize parsley validation on the form
			this.form = this.$el.parsley();
			
			this.form.on( 'field:validated', this.validateForm );
		},

		validateForm: function validateForm() {
			var ok = $( '.parsley-error' ).length === 0;
			$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
			$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
		},

		toggleChildRegistrationNumbersInput: function toggleChildRegistrationNumbersInput() {
			// get the selected interest radio button value
			var selectedInterest = this.$( '.interest:checked' ).val();
			// if the selected interest is child info, show the information packet section, otherwise hide it
			selectedInterest === 'child info'
				? this.$childRegistrationNumbersContainer.removeClass( 'hidden' )
				: this.$childRegistrationNumbersContainer.addClass( 'hidden' );
		}

	});
}());