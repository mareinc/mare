(function () {
	'use strict';

	mare.routers.Form_ChildRegistration = Backbone.Router.extend({

		initialize: function initialize() {
			// Load the view for the right sidebar
			mare.views.sidebar = mare.views.sidebar || new mare.views.Sidebar();
			// create a view for the child registration form
			mare.views.form_childRegistration = mare.views.form_childRegistration || new mare.views.Form_ChildRegistration();
		}

	});

}());
