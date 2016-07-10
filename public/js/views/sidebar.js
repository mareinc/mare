(function () {
	'use strict';

	mare.views.Sidebar = Backbone.View.extend({
		el: 'body',

		events: {
			'click .button--donate'				: 'navigate',
			'click .button--have-a-question'	: 'navigate'
		},

		navigate: function navigate(event) {
			$(event.currentTarget);
        	window.location.href = $(event.currentTarget).data('url');
        }
		
	});
}());
