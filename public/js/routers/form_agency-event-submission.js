(function () {
	'use strict';

	mare.routers.Form_AgencyEventSubmission = Backbone.Router.extend({

		initialize: function initialize() {
			// create a view for the agency event submission form
			mare.views.form_agencyEventSubmission = mare.views.form_agencyEventSubmission || new mare.views.Form_AgencyEventSubmission();
		}

	});

}());
