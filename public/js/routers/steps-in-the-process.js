(function () {
	'use strict';

	mare.routers.StepsInTheProcess = Backbone.Router.extend({

		initialize: function initialize() {
			// create a view for the steps in the process page
			mare.views.stepsInTheProcess = mare.views.stepsInTheProcess || new mare.views.StepsInTheProcess();
		}

	});

}());
