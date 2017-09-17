(function () {
	'use strict';

	mare.views.SiteVisitorRegistration = Backbone.View.extend({
		el: '.form--site-visitor-registration',

		events: {
			'change #is-not-MA-city-checkbox' 		: 'toggleCitySelect',
			'change .other-way-to-hear-about-mare'	: 'toggleOtherWayToHearTextField',
			'submit'								: 'disableRegistrationButton'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$MACityContainer		= this.$( '.ma-city-container' );
			this.$NonMACityContainer	= this.$( '.non-ma-city-container' );
			this.$MACity				= this.$( '#ma-city' );
			this.$NonMACity				= this.$( '#non-ma-city' );
			this.$howDidYouHearOther 	= this.$( '#site-visitor-how-did-you-hear-other' );
			// initialize parsley validation on the form
			this.form = this.$el.parsley();
			// bind the city form elements individually to allow for binding/unbinding parsley validation
			this.MACityValidator 					= this.$MACity.parsley();
			this.nonMACityValidator					= this.$NonMACity.parsley();
			// bind the hidden 'other' text box for use in binding/unbinding validation
			this.howDidYouHearOtherValidator		= this.$howDidYouHearOther.parsley();
			// DOM cache the Parsley validation message for the hidden 'other' field for use in binding/unbinding validation
			this.$howDidYouHearOtherErrorMessage	= this.$howDidYouHearOther.next();

			this.form.on( 'field:validated', this.validateForm );
		},

		toggleOtherWayToHearTextField: function toggleOtherWayToHearTextField() {
			// hide/show the hidden 'other' field via the hidden class
			this.$howDidYouHearOther.toggleClass('hidden');

			if(this.$howDidYouHearOther.hasClass('hidden')) {
				// clear out the input box since it's hidden and not part of the form submission
				this.$howDidYouHearOther.val('');
				// remove the validation binding
				this.$howDidYouHearOther.attr('data-parsley-required', 'false');
				// reset validation on the field.  If it was already validated, we need to clear out the check so the form can be submitted
				this.howDidYouHearOtherValidator.reset();
			} else {
				// add validation binding
				this.$howDidYouHearOther.attr('data-parsley-required', 'true');
			}
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

		disableRegistrationButton: function disableDonateButton() {
			this.$( '.register' ).attr( 'disabled', 'disabled' );
		},

		validateForm: function validateForm() {
			var ok = $( '.parsley-error' ).length === 0;
			$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
			$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
		}
	});
}());