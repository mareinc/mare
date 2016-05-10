(function () {
	'use strict';

	mare.views.SiteMenu = Backbone.View.extend({
		el: '.top-nav',

		events: {
			'click .log-in-link'		: 'logIn',
			'click .log-in-container'	: 'fixClickPropagation' // TODO: This is a hacky mess, change the top nav for better markup and JavaScript
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$logInContainer = $('.log-in-container');
		},

		logIn: function logIn() {
			this.$logInContainer.toggle();
		},

		fixClickPropagation: function fixClickPropagation(event) {
			event.stopPropagation();
		}

	});
}());