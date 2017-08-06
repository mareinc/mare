(function () {
	'use strict';

	mare.routers.Registration = Backbone.Router.extend({

		routes: {
			''				: 'loadDefault',
			'family'		: 'loadFamilyRegistration',
			'site-visitor' 	: 'loadSiteVisitorRegistration',
			'social-worker'	: 'loadSocialWorkerRegistration',
			'*other'		: 'loadDefault'
		},

		initialize: function() {
			// load the view for the registration page as a whole
			mare.views.registration = mare.views.registration || new mare.views.Registration();
		},

		loadSiteVisitorRegistration: function loadSiteVisitorRegistration() {
			// initialize the view for the site user form if it doesn't already exist
			mare.views.siteVisitorRegistration = mare.views.siteVisitorRegistration || new mare.views.SiteVisitorRegistration();
			// update the form selector to match the form we're showing the user
			mare.views.registration.updateFormSelector('siteVisitor');
			// use the view for the reigistraiton page as a whole to display the correct area
			mare.views.registration.showSiteVisitorForm();
		},

		loadSocialWorkerRegistration: function loadSocialWorkerRegistration() {
			// initialize the view for the social worker form if it doesn't already exist
			mare.views.socialWorkerRegistration = mare.views.socialWorkerRegistration || new mare.views.SocialWorkerRegistration();
			// update the form selector to match the form we're showing the user
			mare.views.registration.updateFormSelector('socialWorker');
			// use the view for the reigistraiton page as a whole to display the correct area
			mare.views.registration.showSocialWorkerForm();
		},

		loadFamilyRegistration: function loadFamilyRegistration() {
			// initialize the view for the family form if it doesn't already exist
			mare.views.familyRegistration = mare.views.familyRegistration || new mare.views.FamilyRegistration();
			// update the form selector to match the form we're showing the user
			mare.views.registration.updateFormSelector('prospectiveParent');
			// use the view for the reigistraiton page as a whole to display the correct area
			mare.views.registration.showFamilyForm();
		},
		/* handle any poorly formed routes or navigation to the registration page without specifying a route by rerouting to the default form */
		loadDefault: function loadDefault() {
			this.navigate( 'family', { trigger: true, replace: true } );
		}

	});

}());