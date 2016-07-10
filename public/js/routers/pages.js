(function () {
	'use strict';

	mare.routers.Pages = Backbone.Router.extend({

		initialize: function initialize() {
			// Load the view for the right sidebar
			mare.views.sidebar = mare.views.sidebar || new mare.views.Sidebar();
		}

	});

}());
