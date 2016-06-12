(function () {
	'use strict';

	mare.routers.SuccessStory = Backbone.Router.extend({

		routes: {
			'.*' : 'loadSuccessStory'
		},

		loadSuccessStory: function loadSuccessStory() {
			// Load the view for the success story
			mare.views.successStory = mare.views.successStory || new mare.views.SuccessStory();
		}

	});

}());