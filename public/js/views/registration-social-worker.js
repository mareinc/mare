(function () {
	'use strict';

	mare.views.SocialWorkerRegistration = Backbone.View.extend({
		el: '.registration-form--social-worker',

		initialize: function() {
			// Initialize parsley validation on the form
			this.form = this.$el.parsley();
			this.form.on('field:validated', this.validateForm);
		},

		validateForm: function validateForm() {
			var ok = $('.parsley-error').length === 0;
			$('.bs-callout-info').toggleClass('hidden', !ok);
			$('.bs-callout-warning').toggleClass('hidden', ok);
		}

	});
})();