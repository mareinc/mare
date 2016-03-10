(function () {
	'use strict';

	mare.views.SiteVisitorRegistration = Backbone.View.extend({
		el: '.registration-form--site-visitor',

		events: {
			'change .other-way-to-hear-about-mare': 'toggleOtherWayToHearTextField'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$howDidYouHearOther = this.$('#site-visitor-how-did-you-hear-other');
			// Initialize parsley validation on the form
			this.form = this.$el.parsley();
			this.form.on('field:validated', this.validateForm);
		},

		toggleOtherWayToHearTextField: function toggleOtherWayToHearTextField() {
			this.$howDidYouHearOther.toggleClass('hidden');
		},

		validateForm: function validateForm() {
			var ok = $('.parsley-error').length === 0;
			$('.bs-callout-info').toggleClass('hidden', !ok);
			$('.bs-callout-warning').toggleClass('hidden', ok);

			// need to add a check to show site-visitor-how-did-you-hear-error if no checkboxes are checked
		}

	});
})();