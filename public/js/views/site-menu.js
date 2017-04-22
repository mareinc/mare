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

			// screen width breakpoints (same as _component-menu.scss)
			this.EXTRASMALLSCREEN_WIDTH			= 0;	// mobile breakpoint
			this.SMALLSCREEN_WIDTH				= 655;	// small breakpoint
			this.MEDIUMSCREEN_WIDTH				= 765;	// medium breakpoint
			this.LARGESCREEN_WIDTH				= 850;	// desktop breakpoint

			// menu heights @ above breakpoints (same as _component-menu.scss)
			this.EXTRASMALLSCREEN_MENU_HEIGHT 	= 91; 	// mobile header height
			this.SMALLSCREEN_MENU_HEIGHT 		= 151; 	// small header height
			this.MEDIUMSCREEN_MENU_HEIGHT 		= 120;	// medium header height
			this.LARGESCREEN_MENU_HEIGHT 		= 128;	// desktop header height

			// DOM cache any commonly used elements to improve performance
			this.$logInContainer 	= $('.log-in-container');
			this.$header 			= $('.global-header');
			this.$body 				= $('.body');
			this.$window 			= $(window);
			this.$submenu 			= $('.main-nav__items--submenu');

			this.$window.on('resize', this.resizeMenu.bind(this));
			this.$window.on('scroll', this.toggleFixedMenu.bind(this));

			// initialize global header height so that height will transition on first menu open
			this.$header.css('height', this.findBaseHeaderHeight());
			this.$header.data('height', 0);
		},

		logIn: function logIn() {
			this.$logInContainer.toggle();
		},

		toggleFixedMenu: function toggleFixedMenu() {
			var scroll = this.$window.scrollTop(),
				height = this.$header.outerHeight();

		    if (scroll > 0) {
		        this.$header.addClass('global-header--fixed');
		        if( (height - scroll) > 0) {
		        	this.$body.css('margin-top', height);
		        }
		    }
		    else {
		        this.$header.removeClass('global-header--fixed');
		        this.$body.removeAttr('style');
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

		// return header height based on window width
		findBaseHeaderHeight: function findBaseHeaderHeight() {

			var windowWidth = this.$window.outerWidth(),
				headerHeight = 0;

			if( windowWidth < this.SMALLSCREEN_WIDTH ) {
				headerHeight = this.EXTRASMALLSCREEN_MENU_HEIGHT;
			} else if( windowWidth >= this.SMALLSCREEN_WIDTH && windowWidth < this.MEDIUMSCREEN_WIDTH ) {
				headerHeight = this.SMALLSCREEN_MENU_HEIGHT;
			} else if( windowWidth >= this.MEDIUMSCREEN_WIDTH && windowWidth < this.LARGESCREEN_WIDTH ) {
				headerHeight = this.MEDIUMSCREEN_MENU_HEIGHT;
			} else if( windowWidth >= this.LARGESCREEN_WIDTH ) {
				headerHeight = this.LARGESCREEN_MENU_HEIGHT;
			}

			return headerHeight;
		},

		// align the submenu with the selected menu item above
		resizeMenu: function resizeMenu(event) {

			// if we're already in transition, return
			if($('.in-transition').length > 0) {
				return;
			}
			
			var $currentMenuItem 	= $('.active'),
				heightBuffer 		= this.$header.data('height');

			// set in transition indicator
			$currentMenuItem.addClass('in-transition');

			// remove any previous adjustments to submenu 
			this.$submenu.removeClass('main-nav__items--right');
			this.$submenu.removeAttr('style');		

			// if a menu item is selected
			if( $currentMenuItem.length > 0 ) {
				
				// determine placement of selected the menu item
				var distFromLeft 		= $currentMenuItem.offset().left,
					width 				= $currentMenuItem.children('.main-nav__link').width(),
					widthPlusPadding	= $currentMenuItem.children('.main-nav__link').outerWidth(),
					padding 			= width - widthPlusPadding,
					distFromRight		= this.$window.width() - (distFromLeft + width) + padding/2;

				// if there's not enough room for the submenu to the right, apply right padding and style 
				if( distFromRight < 250 ) {
					this.$submenu.addClass('main-nav__items--right');
					// TODO: figure this out when flex-grow comes into play and submenu is too far right
					this.$submenu.css('padding-right', distFromRight);
				} 

				// otherwise, set the left padding of the submenu
				else {
					this.$submenu.css('padding-left', distFromLeft);
				}

				var selectedSubmenuHeight = $currentMenuItem.children('.main-nav__items--submenu').outerHeight();

				// set the global heder height
				var height = this.findBaseHeaderHeight() + selectedSubmenuHeight;
				this.$header.css('height', height);
				this.$header.data('height', selectedSubmenuHeight);
			}

			if(event.type === 'resize') {
				// this is a resize event, we want to resize right away
			  	$('.in-transition').removeClass('in-transition');
			} else {
			  	this.finishTransition();	
			}		
			
		},

		toggleMenuExpand: function toggleMenuExpand(event) {

			// if we're already in transition, return
			if($('.in-transition').length > 0) {
				return;
			}

			// find current target 
			var $current 		= $(event.currentTarget),
				$previous 		= $('.active'),
				isPrevious 		= $current.hasClass('active'),
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

				// set menu height 
				this.$header.css('height', this.findBaseHeaderHeight());

				// remove submenu buffer	
				this.$header.data('height', 0);

				this.finishTransition();
			}

			// TODO: figure out how to keep the active class on even when the page refreshes?
			
		}

	});
}());