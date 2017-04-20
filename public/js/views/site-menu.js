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
			$(window).on('scroll', this.toggleBoxShadow);
		},

		logIn: function logIn() {
			this.$logInContainer.toggle();
		},

		// TODO: debounce this ?
		toggleBoxShadow: function toggleBoxShadow() {
			var scroll = $(window).scrollTop();
		    if (scroll > 0) {
		        $('.global-header').addClass('global-header--shadow');
		    }
		    else {
		        $('.global-header').removeClass('global-header--shadow');
		    }
		},

		fixClickPropagation: function fixClickPropagation(event) {
			event.stopPropagation();
		},

		// align the submenu with the selected menu item above
		// TODO: debounce this ?
		resizeMenu: function resizeMenu(event) {
			
			var $selectedMenuItem 	= $('.active'),
				$submenu 			= $('.main-nav__items--submenu'),
				$mainNav 			= $('.main-nav__items');

			// remove any previous adjustments to submenu 
			$submenu.removeClass('main-nav__items--right');
			$submenu.removeAttr('style');			

			// if a menu item is selected
			if( $selectedMenuItem.length > 0 ) {
				
				// determine placement of selected the menu item
				var distFromLeft 		= $selectedMenuItem.offset().left,
					width 				= $selectedMenuItem.children('.main-nav__link').width(),
					widthPlusPadding	= $selectedMenuItem.children('.main-nav__link').outerWidth(),
					padding 			= width - widthPlusPadding,
					distFromRight		= $(window).width() - (distFromLeft + width) + padding/2;

				// if there's not enough room for the submenu to the right, apply right padding and style 
				if( distFromRight < 250 ) {
					$submenu.addClass('main-nav__items--right');
					$submenu.css('padding-right', distFromRight);
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
				isActive 	= $target.hasClass('active'),
				$navItems 	= $('.main-nav__items');

			if( $active.children('.main-nav__items--submenu').outerHeight() > 0 ) {
				// if the active menu item is expanded, remove the fade in transition
				$('.main-nav__items').removeClass('main-nav__items--transition');
			} else {
				// otherwise, add the transitoin
				$('.main-nav__items').addClass('main-nav__items--transition');
			}

			//remove the currently active class
			$active.removeClass('active');

			if( !isActive ) {
				$target.addClass('active');

				this.resizeMenu(event);
			}

			// TODO: figure out how to keep the active class on even when the page refreshes?
			
		}

	});
}());