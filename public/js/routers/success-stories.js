(function () {
	'use strict';

	mare.routers.SuccessStories = Backbone.Router.extend({

		initialize: function initialize() {
			mare.views.successStories = mare.views.successStories || new mare.views.SuccessStories();
		}

	});

}());