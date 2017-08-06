(function () {
	'use strict';

	mare.routers.Events = Backbone.Router.extend({

		initialize: function initialize() {
			// load the view for the events pages
			mare.views.events = mare.views.events || new mare.views.Events();
		}

	});

}());
