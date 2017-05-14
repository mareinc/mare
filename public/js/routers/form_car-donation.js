(function () {
	'use strict';

	mare.routers.Form_CarDonation = Backbone.Router.extend({

		initialize: function initialize() {
			// Load the view for the right sidebar
			mare.views.sidebar = mare.views.sidebar || new mare.views.Sidebar();
			// create a view for the car donation form
			mare.views.form_carDonation = mare.views.form_carDonation || new mare.views.Form_CarDonation();
		}

	});

}());
