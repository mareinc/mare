(function () {
	'use strict';

	mare.routers.Preferences = Backbone.Router.extend({

		routes: {
			'.*' : 'loadPreferencesRouter'
		},

		loadPreferencesRouter: function() {
			console.log('loaded preferences page router');
		}

	});

}());