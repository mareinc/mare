(function () {
	'use strict';

	mare.routers.SuccessStory = Backbone.Router.extend({

		routes: {
			'.*' : 'showDetails'
		},

		showDetails: function showDetails() {
			// Load the view for the success story
			mare.views.successStory = mare.views.successStory || new mare.views.SuccessStory();
		}

	});

}());