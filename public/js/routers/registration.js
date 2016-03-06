(function () {
	'use strict';

	mare.routers.Registration = Backbone.Router.extend({

		// TODO: Split this up based on the form we're showing the user
		routes: {
			'.*' : 'loadRegistrationPage',
		},

		loadRegistrationPage: function() {
			// Load the view for the registration pages
			mare.views.registration = mare.views.registration || new mare.views.Registration();
		}

	});

})();