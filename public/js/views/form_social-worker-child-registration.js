(function () {
	'use strict';

	mare.views.ChildRegistration = Backbone.View.extend({
		el: '.form--child-registration',

		events: {
			'change #is-not-MA-city-or-town-checkbox' 	: 'toggleCityOrTownSelect',
			'change #is-part-of-sibling-group'			: 'toggleSiblingNamesTextbox'
		},

		initialize: function() {
			// DOM cache commonly used elements
			this.$MACityOrTownContainer		= $( '.ma-city-or-town-container' );
			this.$NonMACityOrTownContainer	= $( '.non-ma-city-or-town-container' );
			this.$MACityOrTown				= $( '#ma-city-or-town' );
			this.$NonMACityOrTown			= $( '#non-ma-city-or-town' );
			this.$siblingNamesContainer		= $( '.sibling-names-container' );
			this.$siblingNames				= $( '#sibling-names' );

			// Initialize parsley validation on the form
			this.form = this.$el.parsley();
			// Bind the city/town form elements individually to allow for binding/unbinding parsley validation
			this.MACityOrTownValidator 		= this.$MACityOrTown.parsley();
			this.nonMACityOrTownValidator	= this.$NonMACityOrTown.parsley();
			// Bind the sibling names textbox individually to allow for binding/unbinding parsley validation
			this.siblingNamesValidator		= this.$siblingNames.parsley();
			// triggers parsley validation when the form is submitted
			this.form.on( 'field:validated', this.validateForm );
		},

		validateForm: function validateForm() {
			var ok = $( '.parsley-error' ).length === 0;
			$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
			$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
		},

		toggleCityOrTownSelect: function toggleCityOrTownSelect( event ) {
				// toggle showing of the MA city/town dropdown menu
				this.$MACityOrTownContainer.toggleClass( 'hidden' );
				// toggle showing of the city/town free text field
				this.$NonMACityOrTownContainer.toggleClass( 'hidden' );

				// if the city/town free text field is hidden
				if( this.$NonMACityOrTownContainer.hasClass( 'hidden' ) ) {
					// add the validation binding to the city/town dropdown menu
					this.$MACityOrTown.attr( 'data-parsley-required', 'true' );
					// remove the validation binding from the city/town free text field
					this.$NonMACityOrTown.attr( 'data-parsley-required', 'false' );
					// add the required attribute to the city/town dropdown menu needed to show the red background during form validation
					this.$MACityOrTown.attr( 'required', true );
					// remove the required attribute to the city/town free text field needed to show the red background during form validation
					this.$NonMACityOrTown.attr( 'required', false );
					// reset validation on the city/town free text field field
					// if it was already validated, we need to clear out the check so the form can be submitted
					this.nonMACityOrTownValidator.reset();

				// otherwise, if the city/town dropdown menu is hidden
				} else {
					// add the validation binding to the city/town free text field
					this.$NonMACityOrTown.attr( 'data-parsley-required', 'true' );
					// remove the validation binding from the city/town dropdown menu
					this.$MACityOrTown.attr( 'data-parsley-required', 'false' );
					// add the required attribute to the city/town free text field needed to show the red background during form validation
					this.$MACityOrTown.attr( 'required', true );
					// remove the required attribute from the city/town dropdown menu needed to show the red background during form validation
					this.$NonMACityOrTown.attr( 'required', false );
					// reset validation on the city/town dropdown menu
					// if it was already validated, we need to clear out the check so the form can be submitted
					this.MACityOrTownValidator.reset();
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
				// remove the validation binding from the city/town dropdown menu
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