(function () {
	'use strict';

	mare.views.SiteMenu = Backbone.View.extend({
		el: '.global-header',		// I changed this... why did I have to change this?

		events: {
			'click .log-in-link'			: 'logIn',
			'click .log-in-container'		: 'fixClickPropagation', // TODO: This is a hacky mess, change the top nav for better markup and JavaScript
			'click .main-nav__item--main'	: 'toggleMenuExpand'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$logInContainer = $('.log-in-container');
			$(window).on("resize", this.resizeMenu);
			$(window).on('scroll', this.toggleBoxShadow);

			// initialize global header height so that height will transition on first menu open
			// TODO: fix this so that if we start at a smaller width and increase, it doesn't get messed up
			$('.global-header').css('height', $('.global-header').outerHeight());
			$('.global-header').data('height', 0);
		},

		logIn: function logIn() {
			this.$logInContainer.toggle();
		},

		// TODO: debounce this ?
		// TODO: make this smarter so that the position goes from fixed to relative(?)
		//  	 when the body is scrolled past the height of the header 
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

		// set timeout for header transition to avoid odd gaps/spacing
		finishTransition: function finishTransition() {
			setTimeout(function(){
			  	$('.in-transition').removeClass('in-transition');
			}, 400); // 400ms = duration of header transition
		},

		// align the submenu with the selected menu item above
		resizeMenu: function resizeMenu(event) {

			// if we're already in transition, return
			if($('.in-transition').length > 0) {
				return;
			}
			
			var $currentMenuItem 	= $('.active'),
				$submenu 			= $('.main-nav__items--submenu'),
				$header 			= $('.global-header'),
				heightOffset 		= $header.data('height');

			// set in transition indicator
			$currentMenuItem.addClass('in-transition');

			// remove any previous adjustments to submenu 
			$submenu.removeClass('main-nav__items--right');
			$submenu.removeAttr('style');			

			// if a menu item is selected
			if( $currentMenuItem.length > 0 ) {
				
				// determine placement of selected the menu item
				var distFromLeft 		= $currentMenuItem.offset().left,
					width 				= $currentMenuItem.children('.main-nav__link').width(),
					widthPlusPadding	= $currentMenuItem.children('.main-nav__link').outerWidth(),
					padding 			= width - widthPlusPadding,
					distFromRight		= $(window).width() - (distFromLeft + width) + padding/2;

				// if there's not enough room for the submenu to the right, apply right padding and style 
				if( distFromRight < 250 ) {
					$submenu.addClass('main-nav__items--right');
					// TODO: figure this out when flex-grow comes into play and submenu is too far right
					$submenu.css('padding-right', distFromRight);
				} 

				// otherwise, set the left padding of the submenu
				else {
					$submenu.css('padding-left', distFromLeft);
				}

				var collapsedHeaderHeight = $header.outerHeight() - heightOffset,
					selectedSubmenuHeight = $currentMenuItem.children('.main-nav__items--submenu').outerHeight();

				// set the global heder height
				var height = collapsedHeaderHeight + selectedSubmenuHeight;
				$header.css('height', height);
				$header.data('height', selectedSubmenuHeight);
			}

			this.finishTransition();
			
		},

		toggleMenuExpand: function toggleMenuExpand(event) {

			// if we're already in transition, return
			if($('.in-transition').length > 0) {
				return;
			}

			// find current target 
			var $current 	= $(event.currentTarget),
				$previous 	= $('.active'),
				isPrevious 	= $current.hasClass('active'),
				$header 	= $('.global-header'),
				activeHeight 	= $previous.children('.main-nav__items--submenu').outerHeight();

			//remove the currently active class
			$previous.removeClass('active');

			// if the current menu item !== previous menu item, resize for submenu 
			if( !isPrevious ) {
				$current.addClass('active');

				this.resizeMenu(event);
			} else {
				// set in transition indicator
				$current.addClass('in-transition');

				// reset header height 
				var height = $header.outerHeight() - activeHeight;
				$header.css('height', height);
				$header.data('height', 0);

				this.finishTransition();
			}

			// TODO: figure out how to keep the active class on even when the page refreshes?
			
		}

	});
}());