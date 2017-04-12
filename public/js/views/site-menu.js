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
			$(window).on("resize", this.resizeMenu);

			// TODO: adjust opacity of the menu on window scroll
			// $(window).on("scroll", this.toggleMenuOpacity);
		},

		logIn: function logIn() {
			this.$logInContainer.toggle();
		},

		fixClickPropagation: function fixClickPropagation(event) {
			event.stopPropagation();
		},

		// align the submenu with the selected menu item above
		// TODO: debounce this 
		resizeMenu: function resizeMenu(event) {
			
			var $selectedMenuItem 	= $('.active'),
				$submenu 			= $('.main-nav__items--submenu'),

				// TODO: figure out if we want the hover indicators to move when the alignment does
				$hoverIndicator		= $('.main-nav__hover-indicator');

			// remove any previous adjustments to submenu 
			$submenu.removeClass('main-nav__items--right');
			$submenu.removeAttr('style');

			// TODO: figure out if we want the hover indicators to move when the alignment does
			$hoverIndicator.removeClass('main-nav__hover-indicator--right');

			// if a menu item is selected
			if( $selectedMenuItem.length > 0 ) {
				
				// determine placement of selected the menu item
				var distFromLeft 	= $selectedMenuItem.offset().left,
					width			= $selectedMenuItem.outerWidth(),
					distFromRight	= $(window).outerWidth() - (distFromLeft + width);
				
				// if there's not enough room for the submenu to the right, apply right padding and style 
				if( distFromRight < 250 ) {
					$submenu.addClass('main-nav__items--right');
					$submenu.css('padding-right', distFromRight);

					// TODO: figure out if we want the hover indicators to move when the alignment does
					$hoverIndicator.addClass('main-nav__hover-indicator--right');
				} 

				// otherwise, set the left padding of the submenu
				else {
					$submenu.css('padding-left', distFromLeft);
				}
			}
		},

		toggleMenuExpand: function toggleMenuExpand(event) {
			// find current target 
			var $target 	= $(event.currentTarget),
				$active 	= $('.active'),
				isActive 	= $target.hasClass('active');

			$active.removeClass('active');

			if( !isActive ) {
				$target.addClass('active');

				this.resizeMenu(event);
			}

			// TODO: figure out how to keep the active class on even when the page refreshes?
			
		}

	});
}());