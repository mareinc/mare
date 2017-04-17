(function () {
	'use strict';

	mare.routers.Registration = Backbone.Router.extend({

		// TODO: Split this up based on the form we're showing the user
		routes: {
			''				: 'loadDefault',
			'family'		: 'loadFamilyRegistration',
			'site-visitor' 	: 'loadSiteVisitorRegistration',
			'social-worker'	: 'loadSocialWorkerRegistration',
			'*other'		: 'loadDefault'
		},

		initialize: function() {
			// Load the view for the registration page as a whole
			mare.views.registration = mare.views.registration || new mare.views.Registration();
			// Load the view for the right sidebar
			mare.views.sidebar = mare.views.sidebar || new mare.views.Sidebar();
		},

		loadSiteVisitorRegistration: function loadSiteVisitorRegistration() {
			// Initialize the view for the site user form if it doesn't already exist
			mare.views.siteVisitorRegistration = mare.views.siteVisitorRegistration || new mare.views.SiteVisitorRegistration();
			// Update the form selector to match the form we're showing the user
			mare.views.registration.updateFormSelector('siteVisitor');
			// Use the view for the reigistraiton page as a whole to display the correct area
			mare.views.registration.showSiteVisitorForm();
		},

		loadSocialWorkerRegistration: function loadSocialWorkerRegistration() {
			// Initialize the view for the social worker form if it doesn't already exist
			mare.views.socialWorkerRegistration = mare.views.socialWorkerRegistration || new mare.views.SocialWorkerRegistration();
			// Update the form selector to match the form we're showing the user
			mare.views.registration.updateFormSelector('socialWorker');
			// Use the view for the reigistraiton page as a whole to display the correct area
			mare.views.registration.showSocialWorkerForm();
		},

		loadFamilyRegistration: function loadFamilyRegistration() {
			// Initialize the view for the family form if it doesn't already exist
			mare.views.familyRegistration = mare.views.familyRegistration || new mare.views.FamilyRegistration();
			// Update the form selector to match the form we're showing the user
			mare.views.registration.updateFormSelector('prospectiveParent');
			// Use the view for the reigistraiton page as a whole to display the correct area
			mare.views.registration.showFamilyForm();
		},
		/* Handle any poorly formed routes or navigation to the registration page without specifying a route by rerouting to the default form */
		loadDefault: function loadDefault() {
			this.navigate( 'family', { trigger: true, replace: true } );
		}

	});

}());