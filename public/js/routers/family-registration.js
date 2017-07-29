(function () {
	'use strict';

	mare.routers.FamilyRegistration = Backbone.Router.extend({

		initialize: function initialize() {
			// Load the view for the right sidebar
			mare.views.sidebar = mare.views.sidebar || new mare.views.Sidebar();
			// create a view for the child registration form
			mare.views.familyRegistration = mare.views.familyRegistration || new mare.views.FamilyRegistration();
		}

	});

}());
