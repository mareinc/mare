(function () {
	'use strict';

	mare.views.MobileMenu = Backbone.View.extend({
		el: '#mobile-menu',

		events: {
			'click .mm-next' : 'adjustLogoSize',
			'click .mm-prev' : 'initLogoSize'
		},

		initialize: function() {
			// initialize the mobile menu attached to the hamburger icon
			this.$el.mmenu({
				"extensions": [
					"border-full",				
					"fullscreen"
				],
				"offCanvas": {
					"position": "left"
				},
				"counters": true,
				"navbars": [
					{
						"height": 2,
						"position": "top",
						content : [ 
							'<a href="/"><img class="mm-logo" src="/dist/img/mare-logo.svg" alt="Massachusetts Adoption Resource Exchange"></a>',
							'close'
						]
					},
					{
						"position": "bottom",
						"content": [
							"<a class='top-nav__link top-nav__item top-nav__button top-nav__button--green' href='/donate'>Donate</a>",
							"<a class='top-nav__link top-nav__item top-nav__button'>Log In</a>"
						]
					}
				]
			});
			// allows the mobile menu to be seen (it was hidden to prevent it flashing on the screen during page load)
			this.$el.removeClass('hidden');

			// DOM cache elements 
			this.$logo = $('.mm-logo');
			this.$panel = $('.mm-panel');
			this.$navbar = $('.mm-navbar-size-2');
		},

		initLogoSize: function initLogoSize() {
			this.$logo.removeClass('mm-logo--smaller');
			this.$panel.removeClass('mm-panel--less-top');
			this.$navbar.removeClass('mm-navbar-size-2--shorter');
		},

		adjustLogoSize: function adjustLogoSize() {
			this.$logo.toggleClass('mm-logo--smaller');
			this.$panel.toggleClass('mm-panel--less-top');
			this.$navbar.toggleClass('mm-navbar-size-2--shorter');
		}

	});
}());