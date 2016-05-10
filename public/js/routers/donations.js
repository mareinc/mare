(function () {
	'use strict';

	mare.routers.Donations = Backbone.Router.extend({

		routes: {
			'.*' : 'loadDonationsPage'
		},

		loadDonationsPage: function() {
			// Load the view for the donations page
			mare.views.donations = mare.views.donations || new mare.views.Donations();
		}

	});

}());