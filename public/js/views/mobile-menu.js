(function () {
	'use strict';

	mare.views.MobileMenu = Backbone.View.extend({
		el: '#mobile-menu',

		initialize: function() {
			// initialize the mobile menu attached to the hamburger icon
			this.$el.mmenu({
				"extensions": [
					"border-full",				
					"theme-white",
					"fullscreen",
					"popup"
				],
				"offCanvas": {
					"position": "left"
				},
				"counters": true,
				"navbars": [
					{
						"position": "top",
						"content": [
							"prev",
							"title",
							"close"
						]
					},
					{
						"position": "bottom",
						"content": [
							"<a class='fa fa-envelope' href='#/'></a>",
							"<a class='fa fa-twitter' href='#/'></a>",
							"<a class='fa fa-facebook' href='#/'></a>"
						]
					}
				]
			});
			// allows the mobile menu to be seen (it was hidden to prevent it flashing on the screen during page load)
			this.$el.removeClass('hidden');
		}

	});
}());