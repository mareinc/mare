(function () {
	'use strict';

	mare.routers.StepsInTheProcess = Backbone.Router.extend({

		initialize: function initialize() {
			mare.views.stepsInTheProcess = mare.views.stepsInTheProcess || new mare.views.StepsInTheProcess();
			// Load the view for the right sidebar
			mare.views.sidebar = mare.views.sidebar || new mare.views.Sidebar();
		}

	});

}());
