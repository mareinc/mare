(function () {
	'use strict';

	mare.routers.Forms = Backbone.Router.extend({

		routes: {
			'' : 'loadFormPage',
		},

		loadFormPage: function() {
			console.log('loaded forms page router');
		}

	});

})();