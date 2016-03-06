(function () {
	'use strict';

	mare.views.FamilyRegistration = Backbone.View.extend({
		el: 'body',

		events: {
			'change .other-way-to-hear-about-mare'			: 'toggleOtherWayToHearTextField',
			'change #prospective-parent-or-family-state'	: 'toggleHomestudySubmission',
			'change .homestudy-completed-checkbox'			: 'toggleHomestudySection',
			'change #upload-button'							: 'uploadForm'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$howDidYouHearOther			= $('#prospective-parent-how-did-you-hear-other');
			this.$state							= $('#prospective-parent-or-family-state');
			this.$homestudySection				= $('.prospective-family-submit-your-homestudy-section');
			this.$homestudySubmissionSection	= $('.prospective-parent-homestudy-details-section');
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
				$('[name=HomeStudySubmission]').attr('checked', false);
				$('#home-study-file-upload').val(''); // TODO: homestudy is one word, the JavaScript, HTML, and CSS needs to be cleaned up everywhere for this
			}
		},

		toggleHomestudySection: function toggleHomestudySection() {
			this.$homestudySubmissionSection.toggleClass('hidden');
		},

		uploadForm: function uploadForm(event) {
			var target = event.target
			$("#home-study-file-upload").val(target.value);
		}

	});
})();