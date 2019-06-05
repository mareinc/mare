(function () {
	'use strict';

	mare.routers.Tools = Backbone.Router.extend({

		initialize: function initialize() {
			// load the default view
			mare.views.tools = mare.views.tools || new mare.views.Tools();
		}

	});

}());
