(function () {
	'use strict';

	mare.views.SocialWorkerRegistration = Backbone.View.extend({
		el: '.registration-form--social-worker',

		events: {
			'change .social-worker-title-checkbox': 'toggleSocialWorkerTitleTextField'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$socialWorkerTitle = this.$('#social-worker-title');
			this.$socialWorkerTitleGroup = this.$('.social-worker-title-group');
			// Initialize parsley validation on the form
			this.form = this.$el.parsley();
			// Bind the hidden 'title' text box for use in binding/unbinding validation
			this.socialWorkerTitleValidator = this.$socialWorkerTitle.parsley();
			// DOM cache the Parsley validation message for the hidden 'other' field for use in binding/unbinding validation
			this.$socialWorkerTitleErrorMessage = this.$socialWorkerTitle.next();

			this.form.on('field:validated', this.validateForm);
		},

		toggleSocialWorkerTitleTextField: function toggleSocialWorkerTitleTextField() {
			// Hide/show the hidden 'other' field via the hidden class
			this.$socialWorkerTitleGroup.toggleClass('hidden');

			if(this.$socialWorkerTitleGroup.hasClass('hidden')) {
				// Clear out the input box since it's hidden and not part of the form submission
				this.$socialWorkerTitle.val('');
				// Remove the validation binding
				this.$socialWorkerTitle.attr('data-parsley-required', 'false');
				// Reset validation on the field.  If it was already validated, we need to clear out the check so the form can be submitted
				this.socialWorkerTitleValidator.reset();
			} else {
				// Add validation binding
				this.$socialWorkerTitle.attr('data-parsley-required', 'true');
				// Create a custom error message to display if validation fails
				this.$socialWorkerTitle.attr('data-parsley-error-message', 'required');
			}
		},

		validateForm: function validateForm() {
			var ok = $('.parsley-error').length === 0;
			$('.bs-callout-info').toggleClass('hidden', !ok);
			$('.bs-callout-warning').toggleClass('hidden', ok);
		}

	});
})();