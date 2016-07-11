(function () {
	'use strict';

	mare.routers.Home = Backbone.Router.extend({

		initialize: function initialize() {
			// Load the view for the home page
			mare.views.home = mare.views.home || new mare.views.Home();
		}

	});

}());
