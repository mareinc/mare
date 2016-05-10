(function () {
	'use strict';

	mare.views.Registration = Backbone.View.extend({
		el: 'body',

		events: {
			'change .registration-type-selector': 'changeForm'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$formSelector		= this.$( '.registration-type-selector' );
			this.$siteVisitorForm	= this.$( '.site-visitor-registration' );
			this.$socialWorkerForm	= this.$( '.social-worker-registration' );
			this.$familyForm 		= this.$( '.family-registration' );
		},

		changeForm: function changeForm() {
			this.currentForm = this.$formSelector.val();

			switch(this.currentForm) {
				case 'siteVisitor'			: mare.routers.registration.navigate( 'site-visitor', { trigger: true } ); break;
				case 'socialWorker'			: mare.routers.registration.navigate( 'social-worker', { trigger: true } ); break;
				case 'prospectiveParent'	: mare.routers.registration.navigate( 'family', { trigger: true } ); break;
				default						: mare.routers.registration.navigate( 'site-visitor', { trigger: true, replace: true } );
			}
		},

		updateFormSelector: function updateFormSelector(selection) {
			this.$formSelector.val(selection);
		},

		showSiteVisitorForm: function showSiteVisitorForm() {
			this.$socialWorkerForm.fadeOut();
			this.$familyForm.fadeOut();
			this.$siteVisitorForm.fadeIn();
		},

		showSocialWorkerForm: function showSocialWorkerForm() {
			this.$siteVisitorForm.fadeOut();
			this.$familyForm.fadeOut();
			this.$socialWorkerForm.fadeIn();
		},

		showFamilyForm: function showFamilyForm() {
			this.$siteVisitorForm.fadeOut();
			this.$socialWorkerForm.fadeOut();
			this.$familyForm.fadeIn();
		}

	});
}());