(function () {
	'use strict';

	mare.views.Registration = Backbone.View.extend({
		el: 'body',

		events: {
			'change .registration-type-selector': 'changeForm'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$formSelector			= this.$( '.registration-type-selector' );
			this.$siteUserForm			= this.$( '.site-visitor-registration' );
			this.$socialWorkerForm		= this.$( '.social-worker-registration' );
			this.$prospectiveParentForm = this.$( '.prospective-parent-registration' );
		},

		changeForm: function changeForm() {
			this.currentForm = this.$formSelector.val();

			switch(this.currentForm) {
				case 'siteVisitor'			: mare.routers.registration.navigate( 'site-user', { trigger: true } ); break;
				case 'socialWorker'			: mare.routers.registration.navigate( 'social-worker', { trigger: true } ); break;
				case 'prospectiveParent'	: mare.routers.registration.navigate( 'family', { trigger: true } ); break;
				default						: mare.routers.registration.navigate( 'site-user', { trigger: true, replace: true } );
			}
		},

		updateFormSelector: function updateFormSelector(selection) {
			this.$formSelector.val(selection);
		},

		showSiteUserForm: function showSiteUserForm() {
			this.$socialWorkerForm.fadeOut();
			this.$prospectiveParentForm.fadeOut();
			this.$siteUserForm.fadeIn();
		},

		showSocialWorkerForm: function showSocialWorkerForm() {
			this.$siteUserForm.fadeOut();
			this.$prospectiveParentForm.fadeOut();
			this.$socialWorkerForm.fadeIn();
		},

		showFamilyForm: function showFamilyForm() {
			this.$siteUserForm.fadeOut();
			this.$socialWorkerForm.fadeOut();
			this.$prospectiveParentForm.fadeIn();
		}

	});
})();