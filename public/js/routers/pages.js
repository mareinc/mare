(function () {
	'use strict';

	mare.routers.Pages = Backbone.Router.extend({

		initialize: function initialize() {
			// create a view for generic pages created via the WYSIWYG editor
			mare.views.pages = mare.views.pages || new mare.views.Pages();
		}

	});

}());
