(function () {
	'use strict';

	mare.routers.SuccessStories = Backbone.Router.extend({

		initialize: function initialize() {
			mare.views.successStories = mare.views.successStories || new mare.views.SuccessStories();
			// Load the view for the right sidebar
			mare.views.sidebar = mare.views.sidebar || new mare.views.Sidebar();
		}

	});

}());
