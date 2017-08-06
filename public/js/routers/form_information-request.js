(function () {
	'use strict';

	mare.routers.Form_InformationRequest = Backbone.Router.extend({

		initialize: function initialize() {
			// create a view for the information request form
			mare.views.form_informationRequest = mare.views.form_informationRequest || new mare.views.Form_InformationRequest();
		}

	});

}());
