(function () {
	'use strict';

	mare.routers.Form_HaveAQuestion = Backbone.Router.extend({

		initialize: function initialize() {
			// create a view for the have a question form
			mare.views.form_haveAQuestion = mare.views.form_haveAQuestion || new mare.views.Form_HaveAQuestion();
		}

	});

}());
