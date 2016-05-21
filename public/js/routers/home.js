(function () {
	'use strict';

	mare.routers.Home = Backbone.Router.extend({

		routes: {
			'.*' : 'loadHomePage'
		},

		loadHomePage: function() {
			// Load the view for the home page
			mare.views.home = mare.views.home || new mare.views.Home();
		}

	});

}());