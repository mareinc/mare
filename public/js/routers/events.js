(function () {
	'use strict';

	mare.routers.Events = Backbone.Router.extend({

		initialize: function initialize() {
			mare.views.events = mare.views.events || new mare.views.Events();
		}

	});

}());