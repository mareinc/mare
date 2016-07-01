(function () {
	'use strict';

	mare.views.Sidebar = Backbone.View.extend({
		el: 'body',

		events: {
			'click .button--donate'				: 'goToDonatePage',
			'click .button--have-a-question'	: 'goToHaveAQuestionPage'
		},

		goToDonatePage: function goToDonatePage() {
			window.open("/donate","_self")
		},

		goToHaveAQuestionPage: function goToHaveAQuestionPage() {
			window.open('/form/information-request-form', '_self');
		}

	});
}());