(function () {
	'use strict';

	mare.routers.Forms = Backbone.Router.extend({

		routes: {
			'.*' : 'loadFormPage'
		},

		loadFormPage: function() {
			console.log('loaded forms page router');
			// Load the view for the right sidebar
			mare.views.sidebar = mare.views.sidebar || new mare.views.Sidebar();
		}

	});

}());