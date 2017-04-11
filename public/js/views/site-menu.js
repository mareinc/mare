(function () {
	'use strict';

	mare.views.SiteMenu = Backbone.View.extend({
		el: '.global-header',		// I changed this... why did I have to change this?

		events: {
			'click .log-in-link'		: 'logIn',
			'click .log-in-container'	: 'fixClickPropagation', // TODO: This is a hacky mess, change the top nav for better markup and JavaScript
			'click .main-nav__item'		: 'toggleMenuExpand'
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
		},

		toggleMenuExpand: function toggleMenuExpand(event) {
			// remove previously active class
			$('.active').removeClass('active');

			// add active class to this menu element
			var $target = $(event.currentTarget);
			$target.addClass('active');

			// calculate the left padding of the submenu
			var distFromLeft = $target.offset().left;

			// set the left padding of the submenu
			$target.children('.main-nav__items--submenu').css('padding-left', distFromLeft);

			// TODO: if there is not enough room to show the menus underneath, 
			// align right and give more space for the items...

			// TODO: figure out how to keep the active class on even when the page refreshes?
			
		}

	});
}());