(function () {
	'use strict';

	mare.views.FamilyRegistration = Backbone.View.extend({
		el: '.form--family-registration',

		events: {
			'change #is-not-MA-city-checkbox' 		: 'toggleCitySelect',
			'change #upload-button'					: 'uploadForm',
			'change #children-in-home'				: 'toggleFamilyDetailsForm',
			'change .adoption-preferences-trigger'	: 'checkAdoptionPreferences'
		},

		initialize: function() {
			// create a hook to access the child in home fields template
			var childInHomeHtml = $( '#child-in-home' ).html();
			// compile the template to be used adding/removing child in home field groups
			this.template = Handlebars.compile( childInHomeHtml );
			// DOM cache any commonly used elements to improve performance
			this.$MACityContainer						= this.$( '.ma-city-container' );
			this.$NonMACityContainer					= this.$( '.non-ma-city-container' );
			this.$MACity								= this.$( '#ma-city' );
			this.$NonMACity								= this.$( '#non-ma-city' );
			this.$state									= this.$( '#family-state' ); // TODO: may not need
			this.$homestudyCompletionDate				= this.$( '#homestudy-date-complete' );
			this.$socialWorkerName						= this.$( '#social-worker-name' );
			this.$socialWorkerAgency					= this.$( '#social-worker-agency' );
			this.$socialWorkerPhone						= this.$( '#social-worker-phone' );
			this.$socialWorkerEmail						= this.$( '#social-worker-email' );
			this.$homestudySection						= this.$( '.family-submit-your-homestudy-section' );
			this.$homestudySubmissionSection			= this.$( '.family-homestudy-details-section' );
			this.$childrenInHome 						= this.$( '#children-in-home' );
			this.$childrenInHomeDetails 				= this.$( '.children-in-home-details' );

			// initialize parsley validation on the form
			this.form = this.$el.parsley();
			// bind the city form elements individually to allow for binding/unbinding parsley validation
			this.MACityValidator 		= this.$MACity.parsley();
			this.nonMACityValidator		= this.$NonMACity.parsley();
			// bind the hidden homestudy text boxes. For use in binding/unbinding validation
			this.homestudyCompletionDateValidator 	= this.$homestudyCompletionDate.parsley();

			this.socialWorkerNameValidator 			= this.$socialWorkerName.parsley();
			this.socialWorkerAgencyValidator 		= this.$socialWorkerAgency.parsley();
			this.socialWorkerPhoneValidator 		= this.$socialWorkerPhone.parsley();
			this.socialWorkerEmailValidator 		= this.$socialWorkerEmail.parsley();

			this.form.on( 'field:validated', this.validateForm );
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

		toggleHomestudySection: function toggleHomestudySection() {
			// hide/show the hidden homestudy section via the hidden class
			this.$homestudySubmissionSection.toggleClass( 'hidden' );

			if( this.$homestudySubmissionSection.hasClass( 'hidden' ) ) {
				// clear out the homestudy input fields since the section is hidden and not part of the form submission
				this.$homestudyCompletionDate.val( '' );
				this.$socialWorkerName.val( '' );
				this.$socialWorkerAgency.val( '' );
				this.$socialWorkerPhone.val( '' );
				this.$socialWorkerEmail.val( '' );
				// remove validation bindings
				this.$homestudyCompletionDate.attr( 'data-parsley-required', 'false' );
				this.$socialWorkerName.attr( 'data-parsley-required', 'false' );
				this.$socialWorkerAgency.attr( 'data-parsley-required', 'false' );
				this.$socialWorkerPhone.attr( 'data-parsley-required', 'false' );
				this.$socialWorkerEmail.attr( 'data-parsley-required', 'false' );
				// reset validation on the fields.  If they were already validated, we need to clear out the checks so the form can be submitted
				this.homestudyCompletionDateValidator.reset();
				this.socialWorkerNameValidator.reset();
				this.socialWorkerAgencyValidator.reset();
				this.socialWorkerPhoneValidator.reset();
				this.socialWorkerEmailValidator.reset();
			} else {
				// add validation binding
				this.$homestudyCompletionDate.attr( 'data-parsley-required', 'true' );
				this.$socialWorkerName.attr( 'data-parsley-required', 'true' );
				this.$socialWorkerAgency.attr( 'data-parsley-required', 'true' );
				this.$socialWorkerPhone.attr( 'data-parsley-required', 'true' );
				this.$socialWorkerEmail.attr( 'data-parsley-required', 'true' );
			}
		},

		toggleFamilyDetailsForm: function toggleFamilyDetailsForm() {
			// capture the number of children the user has selected in the dropdown
			var selectedQuantity = parseInt( this.$childrenInHome.children( 'option:selected' ).html(), 10 );

			if ( selectedQuantity > 0 ) {
				// show the appropriate number of child forms
				this.generateChildDetailInputs( selectedQuantity );
			} else {
				// count the number of child data groups already shown on the page
				var currentChildrenDisplayed = this.$( '.child-details-form' ).length;
				// remove extra additional child forms
				for( var i = 1; i <= currentChildrenDisplayed; i++ ) {
					$( '.child' + i + '-form' ).remove();
					$( '.child' + i + '-form-heading' ).remove(); // TODO: include the heading as part of the form to make cleanup easier
				}
			}
		},

		// TODO: this needs to be cleaned up a bit, both logic for efficiency and the creation should be handled in a template instead of jQuery.  An identical function exists in registration-family.js as well
		generateChildDetailInputs: function generateChildDetailInputs( selectedNumberOfChildren ) {
			// count the number of child data groups already shown on the page
			var currentChildrenDisplayed = this.$( '.child-details-form' ).length,
				i;

			if( currentChildrenDisplayed > selectedNumberOfChildren ) {
				// remove extra additional child forms
				for( i = currentChildrenDisplayed; i > selectedNumberOfChildren; i-- ) {
					$( '.child' + i + '-form' ).remove();
					$( '.child' + i + '-form-heading' ).remove(); // TODO: include the heading as part of the form to make cleanup easier
				}

			} else {
				// add sections that aren't already on the page
				for( i = currentChildrenDisplayed + 1; i <= selectedNumberOfChildren; i++ ) {
					// pass the relevant data through the child in home template to generate to add to the page
					var html = this.template({ 	index		: i,
												id			: 'child' + i,
												formName	: 'child' + i + '-form',
												formHeading	: 'child' + i + '-form-heading',
												name		: 'child' + i + '-name',
												gender		: 'child' + i + '-gender',
												birthDate	: 'child' + i + '-birthDate',
												type		: 'child' + i + '-type' });

					this.$( '.children-in-home-details' ).append( html );

				}
			}
		},

		uploadForm: function uploadForm( event ) {
			// get the full path to the file and trim everything up to and including the last slash to give us just the file name
			var filepath = event.target.value;
			var filename = filepath.substr( filepath.lastIndexOf( '\\' ) + 1 );
			// show the file name to the user as a point of reference after they've selected the file they wish to upload
			this.$( '.homestudy-file-text' ).html( filename );
		},

		validateForm: function validateForm() {
			var ok = $( '.parsley-error' ).length === 0;
			$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
			$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
		}
	});
}());