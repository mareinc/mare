(function () {
	'use strict';

	mare.routers.Recover = Backbone.Router.extend({

		initialize: function initialize() {
			mare.views.recover = mare.views.recover || new mare.views.Recover();
		}
	});
}());