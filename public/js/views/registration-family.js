(function () {
	'use strict';

	mare.views.FamilyRegistration = Backbone.View.extend({
		el: '.form--family-registration',

		events: {
			'change .other-way-to-hear-about-mare'	: 'toggleOtherWayToHearTextField',
			'change #family-state'					: 'toggleHomestudySubmission',
			'change #homestudy-completed-checkbox'	: 'toggleHomestudySection',
			'change #upload-button'					: 'uploadForm',
			'change #children-in-home'				: 'toggleFamilyDetailsForm',
			'change .adoption-preferences-trigger'	: 'checkAdoptionPreferences'
		},

		initialize: function() {
			// Create a hook to access the child in home fields template
			var childInHomeHtml = $( '#child-in-home' ).html();
			// Compile the template to be used adding/removing child in home field groups
			this.template = Handlebars.compile( childInHomeHtml );
			// DOM cache any commonly used elements to improve performance
			this.$state									= this.$( '#family-state' );
			this.$homestudyCompletionDate				= this.$( '#homestudy-date-complete' );
			this.$socialWorkerName						= this.$( '#social-worker-name' );
			this.$socialWorkerAgency					= this.$( '#social-worker-agency' );
			this.$socialWorkerPhone						= this.$( '#social-worker-phone' );
			this.$socialWorkerEmail						= this.$( '#social-worker-email' );
			this.$homestudySection						= this.$( '.family-submit-your-homestudy-section' );
			this.$homestudySubmissionSection			= this.$( '.family-homestudy-details-section' );
			this.$howDidYouHearOther					= this.$( '#family-how-did-you-hear-other' );
			this.$childrenInHome 						= this.$( '#children-in-home' );
			this.$childrenInHomeDetails 				= this.$( '.children-in-home-details' );
			this.$gatheringInformationCheckbox			= this.$( '#gathering-information-checkbox' );
			this.$preferredGenderLabel					= this.$( '.preferred-gender-label' );
			this.$preferredGender						= this.$( '.preferred-gender' );
			this.$legalStatusLabel						= this.$( '.legal-status-label' );
			this.$legalStatus							= this.$( '.legal-status' );
			this.$ageRangeLabel							= this.$( '.age-range-label' );
			this.$ageRangeFrom							= this.$( '.age-range-from' );
			this.$ageRangeTo							= this.$( '.age-range-to' );
			this.$numberOfChildrenPreferredLabel		= this.$( '.number-of-children-preferred-label' );
			this.$numberOfChildrenPreferred 			= this.$( '.number-of-children-preferred' );
			this.$contactWithBiologicalSiblingsLabel	= this.$( '.contact-with-biological-siblings-label' );
			this.$contactWithBiologicalSiblings			= this.$( '.contact-with-biological-siblings' );
			this.$raceLabel								= this.$( '.race-label' );
			this.$race									= this.$( '.race' );
			this.$maximumPhysicalNeedsLabel				= this.$( '.maximum-physical-needs-label' );
			this.$maximumPhysicalNeeds					= this.$( '.maximum-physical-needs' );
			this.$maximumEmotionalNeedsLabel			= this.$( '.maximum-emotional-needs-label' );
			this.$maximumEmotionalNeeds					= this.$( '.maximum-emotional-needs' );
			this.$maximumIntellectualNeedsLabel			= this.$( '.maximum-intellectual-needs-label' );
			this.$maximumIntellectualNeeds				= this.$( '.maximum-intellectual-needs' );

			// Initialize parsley validation on the form
			this.form = this.$el.parsley();

			this.howDidYouHearOtherValidator 		= this.$howDidYouHearOther.parsley(); // Bind the hidden 'other' text box for use in binding/unbinding validation
			this.homestudyCompletionDateValidator 	= this.$homestudyCompletionDate.parsley(); // Bind the hidden homestudy text boxes for use in binding/unbinding validation
			this.socialWorkerNameValidator 			= this.$socialWorkerName.parsley();
			this.socialWorkerAgencyValidator 		= this.$socialWorkerAgency.parsley();
			this.socialWorkerPhoneValidator 		= this.$socialWorkerPhone.parsley();
			this.socialWorkerEmailValidator 		= this.$socialWorkerEmail.parsley();
			// DOM cache the Parsley validation message for the hidden 'other' field for use in binding/unbinding validation
			this.$howDidYouHearOtherErrorMessage = this.$howDidYouHearOther.next();

			this.form.on( 'field:validated', this.validateForm );
		},

		toggleOtherWayToHearTextField: function toggleOtherWayToHearTextField() {
			// Hide/show the hidden 'other' field via the hidden class
			this.$howDidYouHearOther.toggleClass( 'hidden' );

			if( this.$howDidYouHearOther.hasClass( 'hidden' ) ) {
				// Clear out the input box since it's hidden and not part of the form submission
				this.$howDidYouHearOther.val( '' );
				// Remove the validation binding
				this.$howDidYouHearOther.attr( 'data-parsley-required', 'false' );
				// Reset validation on the field.  If it was already validated, we need to clear out the check so the form can be submitted
				this.howDidYouHearOtherValidator.reset();
			} else {
				// Add validation binding
				this.$howDidYouHearOther.attr( 'data-parsley-required', 'true' );
			}
		},

		toggleHomestudySection: function toggleHomestudySection() {
			// Hide/show the hidden homestudy section via the hidden class
			this.$homestudySubmissionSection.toggleClass( 'hidden' );

			if( this.$homestudySubmissionSection.hasClass( 'hidden' ) ) {
				// Clear out the homestudy input fields since the section is hidden and not part of the form submission
				this.$homestudyCompletionDate.val( '' );
				this.$socialWorkerName.val( '' );
				this.$socialWorkerAgency.val( '' );
				this.$socialWorkerPhone.val( '' );
				this.$socialWorkerEmail.val( '' );
				// Remove validation bindings
				this.$homestudyCompletionDate.attr( 'data-parsley-required', 'false' );
				this.$socialWorkerName.attr( 'data-parsley-required', 'false' );
				this.$socialWorkerAgency.attr( 'data-parsley-required', 'false' );
				this.$socialWorkerPhone.attr( 'data-parsley-required', 'false' );
				this.$socialWorkerEmail.attr( 'data-parsley-required', 'false' );
				// Reset validation on the fields.  If they were already validated, we need to clear out the checks so the form can be submitted
				this.homestudyCompletionDateValidator.reset();
				this.socialWorkerNameValidator.reset();
				this.socialWorkerAgencyValidator.reset();
				this.socialWorkerPhoneValidator.reset();
				this.socialWorkerEmailValidator.reset();
			} else {
				// Add validation binding
				this.$homestudyCompletionDate.attr( 'data-parsley-required', 'true' );
				this.$socialWorkerName.attr( 'data-parsley-required', 'true' );
				this.$socialWorkerAgency.attr( 'data-parsley-required', 'true' );
				this.$socialWorkerPhone.attr( 'data-parsley-required', 'true' );
				this.$socialWorkerEmail.attr( 'data-parsley-required', 'true' );
			}
		},

		toggleHomestudySubmission: function toggleHomestudySubmission() {
			var selectedOption	= this.$state.children( 'option:selected' ),
				selectedHTML	= selectedOption.html();

			if( selectedHTML === 'Connecticut' ||
				selectedHTML === 'Massachusetts' ||
				selectedHTML === 'Maine' ||
				selectedHTML === 'New Hampshire' ||
				selectedHTML === 'New York' ||
				selectedHTML === 'Rhode Island' ||
				selectedHTML === 'Vermont' ) {
				// Show the homestudy section of the form
				this.$homestudySection.show();
			} else {
				// hide the homestudy section of the form
				this.$homestudySection.hide();
				// clear out any uploaded homestudy files
				this.$( '[name=HomeStudySubmission]' ).attr( 'checked', false );
				this.$( '#homestudy-file-upload' ).val( '' );
			}
		},

		toggleFamilyDetailsForm: function toggleFamilyDetailsForm() {
			// Capture the number of children the user has selected in the dropdown
			var selectedQuantity = parseInt( this.$childrenInHome.children( 'option:selected' ).html(), 10 );

			if ( selectedQuantity > 0 ) {
				// Show the appropriate number of child forms
				this.generateChildDetailInputs( selectedQuantity );
			} else {
				// Count the number of child data groups already shown on the page
				var currentChildrenDisplayed = this.$( '.child-details-form' ).length;
				// Remove extra additional child forms
				for( var i = 1; i <= currentChildrenDisplayed; i++ ) {
					$( '.child' + i + '-form' ).remove();
					$( '.child' + i + '-form-heading' ).remove(); // TODO: Include the heading as part of the form to make cleanup easier
				}
			}
		},
		/* check the 'where are you in the adoption process' checkboxes to determine whether to require the adoption preferences fields */
		checkAdoptionPreferences: function checkAdoptionPreferences() {
			// check the 'where are you in the adoption process' checkboxes to determine whether to require the adoption preferences fields
			var workingWithAgency = document.getElementById( 'working-with-agency-checkbox' ).checked;
			var mappTrainingCompleted = document.getElementById( 'mapp-training-completed-checkbox' ).checked;
			var homestudyCompleted = document.getElementById( 'homestudy-completed-checkbox' ).checked;
			// determine whether the adoption preferences section of the form should be required
			if( workingWithAgency || mappTrainingCompleted || homestudyCompleted ) {
				this.makeAdoptionPreferencesRequired();
			} else {
				this.makeAdoptionPreferencesNotRequired();
			}
		},
		/* adds form validation on the adoption preferences fields.  They are only required when 'gathering information' is checked */
		makeAdoptionPreferencesRequired: function makeAdoptionPreferencesRequired() {
			// add the necessary form label attributes to show or hide the required * indicator
			this.$preferredGenderLabel.addClass( 'required-field' );
			this.$legalStatusLabel.addClass( 'required-field' );
			this.$ageRangeLabel.addClass( 'required-field' );
			this.$numberOfChildrenPreferredLabel.addClass( 'required-field' );
			this.$contactWithBiologicalSiblingsLabel.addClass( 'required-field' );
			this.$raceLabel.addClass( 'required-field' );
			this.$maximumPhysicalNeedsLabel.addClass( 'required-field' );
			this.$maximumEmotionalNeedsLabel.addClass( 'required-field' );
			this.$maximumIntellectualNeedsLabel.addClass( 'required-field' );
			// add the required class on the input text to display the red text during form validation
			this.$preferredGender.addClass( 'required' );
			this.$legalStatus.addClass( 'required' );
			this.$ageRangeFrom.addClass( 'required' );
			this.$ageRangeTo.addClass( 'required' );
			this.$numberOfChildrenPreferred.addClass( 'required' );
			this.$contactWithBiologicalSiblings.addClass( 'required' );
			this.$race.addClass( 'required' );
			this.$maximumPhysicalNeeds.addClass( 'required' );
			this.$maximumEmotionalNeeds.addClass( 'required' );
			this.$maximumIntellectualNeeds.addClass( 'required' );
			// add the required attribute needed to hide/show the red background during form validation
			this.$preferredGender.attr( 'required', true );
			this.$legalStatus.attr( 'required', true );
			this.$ageRangeFrom.attr( 'required', true );
			this.$ageRangeTo.attr( 'required', true );
			this.$numberOfChildrenPreferred.attr( 'required', true );
			this.$contactWithBiologicalSiblings.attr( 'required', true );
			this.$race.attr( 'required', true );
			this.$maximumPhysicalNeeds.attr( 'required', true );
			this.$maximumEmotionalNeeds.attr( 'required', true );
			this.$maximumIntellectualNeeds.attr( 'required', true );
		},
		/* removes form validation on the adoption preferences fields.  They are only required when 'gathering information' is checked */
		makeAdoptionPreferencesNotRequired: function makeAdoptionPreferencesNotRequired() {
			// add the necessary form label attributes to show or hide the required * indicator
			this.$preferredGenderLabel.removeClass( 'required-field' );
			this.$legalStatusLabel.removeClass( 'required-field' );
			this.$ageRangeLabel.removeClass( 'required-field' );
			this.$numberOfChildrenPreferredLabel.removeClass( 'required-field' );
			this.$contactWithBiologicalSiblingsLabel.removeClass( 'required-field' );
			this.$raceLabel.removeClass( 'required-field' );
			this.$maximumPhysicalNeedsLabel.removeClass( 'required-field' );
			this.$maximumEmotionalNeedsLabel.removeClass( 'required-field' );
			this.$maximumIntellectualNeedsLabel.removeClass( 'required-field' );
			// add the required class on the input text to display the red text during form validation
			this.$preferredGender.removeClass( 'required' );
			this.$legalStatus.removeClass( 'required' );
			this.$ageRangeFrom.removeClass( 'required' );
			this.$ageRangeTo.removeClass( 'required' );
			this.$numberOfChildrenPreferred.removeClass( 'required' );
			this.$contactWithBiologicalSiblings.removeClass( 'required' );
			this.$race.removeClass( 'required' );
			this.$maximumPhysicalNeeds.removeClass( 'required' );
			this.$maximumEmotionalNeeds.removeClass( 'required' );
			this.$maximumIntellectualNeeds.removeClass( 'required' );
			// add the required attribute needed to hide/show the red background during form validation
			this.$preferredGender.attr( 'required', false );
			this.$legalStatus.attr( 'required', false );
			this.$ageRangeFrom.attr( 'required', false );
			this.$ageRangeTo.attr( 'required', false );
			this.$numberOfChildrenPreferred.attr( 'required', false );
			this.$contactWithBiologicalSiblings.attr( 'required', false );
			this.$race.attr( 'required', false );
			this.$maximumPhysicalNeeds.attr( 'required', false );
			this.$maximumEmotionalNeeds.attr( 'required', false );
			this.$maximumIntellectualNeeds.attr( 'required', false );
		},
		// TODO: This needs to be cleaned up a bit, both logic for efficiency and the creation should be handled in a template instead of jQuery.  An identical function exists in form_social-worker-family-registration.js as well
		generateChildDetailInputs: function generateChildDetailInputs( selectedNumberOfChildren ) {
			// Count the number of child data groups already shown on the page
			var currentChildrenDisplayed = this.$( '.child-details-form' ).length,
				i;

			if( currentChildrenDisplayed > selectedNumberOfChildren ) {
				// Remove extra additional child forms
				for( i = currentChildrenDisplayed; i > selectedNumberOfChildren; i-- ) {
					$( '.child' + i + '-form' ).remove();
					$( '.child' + i + '-form-heading' ).remove(); // TODO: Include the heading as part of the form to make cleanup easier
				}

			} else {
				// Add sections that aren't already on the page
				for( i = currentChildrenDisplayed + 1; i <= selectedNumberOfChildren; i++ ) {
					// Pass the relevant data through the child in home template to generate to add to the page
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
			// Get the full path to the file and trim everything up to and including the last slash to give us just the file name
			var filepath = event.target.value;
			var filename = filepath.substr( filepath.lastIndexOf( '\\' ) + 1 );
			// Show the file name to the user as a point of reference after they've selected the file they wish to upload
			this.$( '.homestudy-file-text' ).html( filename );
		},

		validateForm: function validateForm() {
			var ok = $( '.parsley-error' ).length === 0;
			$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
			$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
		}
	});
}());