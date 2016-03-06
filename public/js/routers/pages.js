(function () {
	'use strict';

	mare.routers.Pages = Backbone.Router.extend({

		routes: {
			'' : 'loadGenericPage',
		},

		loadGenericPage: function() {
			console.log('loaded generic page router');
		}

	});

})();