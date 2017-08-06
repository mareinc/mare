(function () {
	'use strict';

	mare.routers.SuccessStories = Backbone.Router.extend({

		initialize: function initialize() {
			// create a view for the success stories pages
			mare.views.successStories = mare.views.successStories || new mare.views.SuccessStories();
		}

	});

}());
