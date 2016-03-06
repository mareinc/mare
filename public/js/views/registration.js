(function () {
	'use strict';

	mare.views.Registration = Backbone.View.extend({
		el: 'body',

		events: {
			'change .registration-type-selector': 'changeForm'
		},

		initialize: function() {
			// Initialize the views for the three registration forms
			mare.views.siteVisitorRegistration = mare.views.siteVisitorRegistration || new mare.views.SiteVisitorRegistration();
			mare.views.socialWorkerRegistration = mare.views.socialWorkerRegistration || new mare.views.SocialWorkerRegistration();
			mare.views.familyRegistration = mare.views.familyRegistration || new mare.views.FamilyRegistration();
			// DOM cache any commonly used elements to improve performance
			this.$formSelector = $('.registration-type-selector');
			this.$siteForm = $('.site-visitor-registration');
			this.$socialWorkerForm = $('.social-worker-registration');
			this.$prospectiveParentForm = $('.prospective-parent-registration');

			this.currentForm = 'siteVisitor';
		},

		changeForm: function changeForm() {
			this.currentForm = this.$formSelector.val();

			switch(this.currentForm) {
				case 'siteVisitor': this.$socialWorkerForm.hide(); this.$prospectiveParentForm.hide(); this.$siteForm.show(); break;
				case 'socialWorker': this.$siteForm.hide(); this.$prospectiveParentForm.hide(); this.$socialWorkerForm.show(); break;
				case 'prospectiveParent': this.$siteForm.hide(); this.$socialWorkerForm.hide(); this.$prospectiveParentForm.show(); break;
			}
		}

	});
})();