(function () {
	'use strict';

	mare.views.ChildRegistration = Backbone.View.extend({
		el: '.form--child-registration',

		events: {
			'change #is-not-MA-city-checkbox' 	: 'toggleCitySelect',
			'change #is-part-of-sibling-group'	: 'toggleSiblingNamesTextbox'
		},

		initialize: function() {
			// DOM cache commonly used elements
			this.$MACityContainer		= this.$( '.ma-city-container' );
			this.$NonMACityContainer	= this.$( '.non-ma-city-container' );
			this.$MACity				= this.$( '#ma-city' );
			this.$NonMACity				= this.$( '#non-ma-city' );
			this.$siblingNamesContainer	= this.$( '.sibling-names-container' );
			this.$siblingNames			= this.$( '#sibling-names' );

			// initialize parsley validation on the form
			this.form = this.$el.parsley();
			// bind the city form elements individually to allow for binding/unbinding parsley validation
			this.MACityValidator 		= this.$MACity.parsley();
			this.nonMACityValidator		= this.$NonMACity.parsley();
			// bind the sibling names textbox individually to allow for binding/unbinding parsley validation
			this.siblingNamesValidator	= this.$siblingNames.parsley();
			// triggers parsley validation when the form is submitted
			this.form.on( 'field:validated', this.validateForm );
		},

		validateForm: function validateForm() {
			var ok = $( '.parsley-error' ).length === 0;
			$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
			$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
		},

		toggleCitySelect: function toggleCitySelect( event ) {
				// toggle showing of the MA city dropdown menu
				this.$MACityContainer.toggleClass( 'hidden' );
				// toggle showing of the city free text field
				this.$NonMACityContainer.toggleClass( 'hidden' );

				// if the city free text field is hidden
				if( this.$NonMACityContainer.hasClass( 'hidden' ) ) {
					// add the validation binding to the city dropdown menu
					this.$MACity.attr( 'data-parsley-required', 'true' );
					// remove the validation binding from the city free text field
					this.$NonMACity.attr( 'data-parsley-required', 'false' );
					// add the required attribute to the city dropdown menu needed to show the red background during form validation
					this.$MACity.attr( 'required', true );
					// remove the required attribute to the city free text field needed to show the red background during form validation
					this.$NonMACity.attr( 'required', false );
					// reset validation on the city free text field field
					// if it was already validated, we need to clear out the check so the form can be submitted
					this.nonMACityValidator.reset();

				// otherwise, if the city dropdown menu is hidden
				} else {
					// add the validation binding to the city free text field
					this.$NonMACity.attr( 'data-parsley-required', 'true' );
					// remove the validation binding from the city dropdown menu
					this.$MACity.attr( 'data-parsley-required', 'false' );
					// add the required attribute to the city free text field needed to show the red background during form validation
					this.$MACity.attr( 'required', true );
					// remove the required attribute from the city dropdown menu needed to show the red background during form validation
					this.$NonMACity.attr( 'required', false );
					// reset validation on the city dropdown menu
					// if it was already validated, we need to clear out the check so the form can be submitted
					this.MACityValidator.reset();
				}
		},

		toggleSiblingNamesTextbox: function toggleSiblingNamesTextbox( event ) {
			// toggle showing of the sibling names textbox
			this.$siblingNamesContainer.toggleClass( 'hidden' );

			// if the child is part of a sibling group
			if( event.target.checked ) {
				// add the validation binding to the sibling names text field
				this.$siblingNames.attr( 'data-parsley-required', 'true' );
				// add the required attribute to the sibling names text field needed to show the red background during form validation
				this.$siblingNames.attr( 'required', true );
			
			// otherwise, if the child is not part of a sibling group
			} else {
				// remove the validation binding from the city dropdown menu
				this.$siblingNames.attr( 'data-parsley-required', 'false' );
				// remove the required attribute from the sibling names text field needed to show the red background during form validation
				this.$siblingNames.attr( 'required', false );
				// clear out the input box since it's hidden and not part of the form submission
				this.$siblingNames.val('');
				// and reset validation on the field.  If it was already validated, we need to clear out the check so the form can be submitted
				this.siblingNamesValidator.reset();
			}
		}
	});
}());