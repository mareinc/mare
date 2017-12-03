(function () {
	'use strict';

	mare.routers.MAREInTheNews = Backbone.Router.extend({

		initialize: function initialize() {
			// load the view for the mare in the news pages
			mare.views.mareInTheNews = mare.views.mareInTheNews || new mare.views.MAREInTheNews();
		}
	});
}());
