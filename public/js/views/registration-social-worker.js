(function () {
	'use strict';

	mare.views.SocialWorkerRegistration = Backbone.View.extend({
		el: '.form--social-worker-registration',

		events: {
			'change .is-not-ma-city-checkbox' 		: 'toggleCitySelect'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$MACityContainer			= this.$( '.city-container' );
			this.$NonMACityContainer		= this.$( '.non-ma-city-container' );
			this.$MACity					= this.$( '.city' );
			this.$NonMACity					= this.$( '.non-ma-city' );
			// initialize parsley validation on the form
			this.form = this.$el.parsley();
			// bind the city form elements individually to allow for binding/unbinding parsley validation
			this.MACityValidator 				= this.$MACity.parsley();
			this.nonMACityValidator				= this.$NonMACity.parsley();

			this.form.on( 'field:validated', this.validateForm );

			// submit form via AJAX on successful validation
			this.form.on( 'form:success', this.submitForm );
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
				this.$NonMACity.attr( 'required', true );
				// remove the required attribute from the city dropdown menu needed to show the red background during form validation
				this.$MACity.attr( 'required', false );
				// reset validation on the city dropdown menu
				// if it was already validated, we need to clear out the check so the form can be submitted
				this.MACityValidator.reset();
			}
		},

		enableRegistrationButton: function enableRegistrationButton() {
			this.$( '.register' ).prop( 'disabled', false );
		},

		disableRegistrationButton: function disableRegistrationButton() {
			this.$( '.register' ).prop( 'disabled', 'disabled' );
		},

		validateForm: function validateForm() {

			var ok = $( '.parsley-error' ).length === 0;

			$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
			$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );

			// if there are no errors and the user is attempting to submit the form
			if( ok && event.type === 'submit' ) {
				// disable the registration button
				mare.views.socialWorkerRegistration.disableRegistrationButton();
			// otherwise, if there are errors
			} else if ( !ok ) {
				// ensure the registration button is enabled
				mare.views.socialWorkerRegistration.enableRegistrationButton();
			}
		},

		// submit registration form via AJAX
		submitForm: function submitForm() {

			// set validation result to false so the form is not auto-submitted 
			// ( this mimics the behavior of event.preventDefault(), but that approach is deprecated by parsely )
			this.validationResult = false;

			// retrieve the data from the form
			var formData = this.$element.serializeArray();

			// post the form data to the registration route
			$.post( '/register', formData )
				.done( function( responseData ) {

					// handle error responses
					if ( responseData.status === 'error' ) {
						
						// display the error message to the user
						mare.views.registration.displayFlashMessage( responseData.flashMessage );

						// enable the register button
						mare.views.socialWorkerRegistration.enableRegistrationButton();
						
					// handle success responses
					} else if ( responseData.status === 'success' ) {
						
						// redirect the user to the success target page
						window.location.href = responseData.targetPage;
					}
				})
				.fail( function( error ) {
					
					// TODO handle errors between the browser and the server
					console.error( error.status + ' - ' + error.statusText );
				});
		}
	});
}());