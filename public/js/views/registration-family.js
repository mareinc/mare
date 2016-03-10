(function () {
	'use strict';

	mare.views.FamilyRegistration = Backbone.View.extend({
		el: 'registration-form--family',

		events: {
			'change .other-way-to-hear-about-mare'			: 'toggleOtherWayToHearTextField',
			'change #prospective-parent-or-family-state'	: 'toggleHomestudySubmission',
			'change .homestudy-completed-checkbox'			: 'toggleHomestudySection',
			'change #upload-button'							: 'uploadForm'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$howDidYouHearOther			= this.$('#prospective-parent-how-did-you-hear-other');
			this.$state							= this.$('#prospective-parent-or-family-state');
			this.$homestudySection				= this.$('.prospective-family-submit-your-homestudy-section');
			this.$homestudySubmissionSection	= this.$('.prospective-parent-homestudy-details-section');
			// Initialize parsley validation on the form
			this.$el.parsley();
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
				this.$('#home-study-file-upload').val(''); // TODO: homestudy is one word, the JavaScript, HTML, and CSS needs to be cleaned up everywhere for this
			}
		},

		toggleHomestudySection: function toggleHomestudySection() {
			this.$homestudySubmissionSection.toggleClass('hidden');
		},

		uploadForm: function uploadForm(event) {
			var target = event.target
			this.$("#home-study-file-upload").val(target.value);
		},

		validateForm: function validateForm() {
			var ok = $('.parsley-error').length === 0;
			$('.bs-callout-info').toggleClass('hidden', !ok);
			$('.bs-callout-warning').toggleClass('hidden', ok);
		}

	});
})();