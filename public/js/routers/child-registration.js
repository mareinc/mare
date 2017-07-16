(function () {
	'use strict';

	mare.routers.ChildRegistration = Backbone.Router.extend({

		initialize: function initialize() {
			// Load the view for the right sidebar
			mare.views.sidebar = mare.views.sidebar || new mare.views.Sidebar();
			// create a view for the child registration form
			mare.views.childRegistration = mare.views.childRegistration || new mare.views.ChildRegistration();
		}

	});

}());
