(function () {
	'use strict';

	mare.routers.WaitingChildProfiles = Backbone.Router.extend({

		routes: {
			'.*' : 'loadWaitingChildProfilesPage',
		},

		loadWaitingChildProfilesPage: function() {
			// Load the view for the waiting child profiles page
			mare.views.waitingChildProfiles = mare.views.waitingChildProfiles || new mare.views.WaitingChildProfiles();
		}

	});

})();