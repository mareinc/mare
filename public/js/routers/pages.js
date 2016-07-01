(function () {
	'use strict';

	mare.routers.Pages = Backbone.Router.extend({

		routes: {
			'.*' : 'loadGenericPage'
		},

		loadGenericPage: function() {
			console.log('loaded generic page router');
			// Load the view for the right sidebar
			mare.views.sidebar = mare.views.sidebar || new mare.views.Sidebar();
		}

	});

}());