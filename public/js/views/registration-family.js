(function () {
	'use strict';

	mare.views.FamilyRegistration = Backbone.View.extend({
		el: '.registration-form--family',

		events: {
			'change .other-way-to-hear-about-mare'	: 'toggleOtherWayToHearTextField',
			'change #family-state'					: 'toggleHomestudySubmission',
			'change .homestudy-completed-checkbox'	: 'toggleHomestudySection',
			'change #upload-button'					: 'uploadForm'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$howDidYouHearOther			= this.$('#family-how-did-you-hear-other');
			this.$state							= this.$('#family-state');
			this.$homestudySection				= this.$('.family-submit-your-homestudy-section');
			this.$homestudySubmissionSection	= this.$('.family-homestudy-details-section');
			// Initialize parsley validation on the form
			this.form = this.$el.parsley();
			// Bind the hidden 'other' text box for use in binding/unbinding validation
			this.howDidYouHearOtherValidator = this.$howDidYouHearOther.parsley();
			// DOM cache the Parsley validation message for the hidden 'other' field for use in binding/unbinding validation
			this.$howDidYouHearOtherErrorMessage = this.$howDidYouHearOther.next();

			this.form.on('field:validated', this.validateForm);
		},

		toggleOtherWayToHearTextField: function toggleOtherWayToHearTextField() {
			this.$howDidYouHearOther.toggleClass('hidden');
		},

		toggleHomestudySubmission: function toggleHomestudySubmission() {
			var selectedOption = this.$state.children('option:selected');

			if(selectedOption.html() === 'Massachusetts') {
				// Show the homestudy section of the form
				this.$homestudySection.show();
			} else {
				// hide the homestudy section of the form
				this.$homestudySection.hide();
				// clear out any uploaded homestudy files
				this.$('[name=HomeStudySubmission]').attr('checked', false);
				this.$('#homestudy-file-upload').val('');
			}
		},

		toggleHomestudySection: function toggleHomestudySection() {
			this.$homestudySubmissionSection.toggleClass('hidden');
		},

		uploadForm: function uploadForm(event) {
			var filepath = event.target.value;
			var filename = filepath.substr( filepath.lastIndexOf("\\") + 1 );

			this.$(".homestudy-file-upload-text").html(filename);
		},

		validateForm: function validateForm() {
			var ok = $('.parsley-error').length === 0;
			$('.bs-callout-info').toggleClass('hidden', !ok);
			$('.bs-callout-warning').toggleClass('hidden', ok);
		}

	});
})();