(function () {
	'use strict';

	mare.routers.ChildRegistration = Backbone.Router.extend({

		initialize: function initialize() {
			// create a view for the child registration form
			mare.views.childRegistration = mare.views.childRegistration || new mare.views.ChildRegistration();
		}

	});

}());
