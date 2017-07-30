(function () {
	'use strict';

	mare.routers.FamilyRegistration = Backbone.Router.extend({

		initialize: function initialize() {
			// create a view for the child registration form
			mare.views.familyRegistration = mare.views.familyRegistration || new mare.views.FamilyRegistration();
		}

	});

}());
