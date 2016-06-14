(function () {
	'use strict';

	mare.routers.SuccessStory = Backbone.Router.extend({

		routes: {
			'.*' : 'showDetails'
		},

		showDetails: function showDetails() {
			// TODO: This is loading for details views as well, which we don't need as there's no JavaScript logic to deal with
			// Load the view for the success story
			mare.views.successStory = mare.views.successStory || new mare.views.SuccessStory();
		}

	});

}());