(function () {
	'use strict';

	mare.views.Registration = Backbone.View.extend({
		el: 'body',

		events: {
			'change .registration-type-selector': 'changeForm'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$formSelector			= $( '.registration-type-selector' );
			this.$siteForm				= $( '.site-visitor-registration' );
			this.$socialWorkerForm		= $( '.social-worker-registration' );
			this.$prospectiveParentForm = $( '.prospective-parent-registration' );

			this.currentForm = 'siteVisitor';
		},

		changeForm: function changeForm() {
			this.currentForm = this.$formSelector.val();

			switch(this.currentForm) {
				case 'siteVisitor'			: mare.routers.registration.navigate( 'site-user', { trigger: true } ); break;
				case 'socialWorker'			: mare.routers.registration.navigate( 'social-worker', { trigger: true } ); break;
				case 'prospectiveParent'	: mare.routers.registration.navigate( 'family', { trigger: true } );
				default						: mare.routers.registration.navigate( 'site-user', { trigger: true, replace: true } );
			}
		},

		showSiteUserForm: function showSiteUserForm() {
			this.$socialWorkerForm.hide();
			this.$prospectiveParentForm.hide();
			this.$siteForm.show();
		},

		showSocialWorkerForm: function showSocialWorkerForm() {
			this.$siteForm.hide();
			this.$prospectiveParentForm.hide();
			this.$socialWorkerForm.show();
		},

		showFamilyForm: function showFamilyForm() {
			this.$siteForm.hide();
			this.$socialWorkerForm.hide();
			this.$prospectiveParentForm.show();
		}

	});
})();