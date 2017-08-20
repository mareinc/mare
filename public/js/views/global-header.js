// TODO: everything for resizing the header is handled through JavaScript, causing jank on the page.  This should be rewritten to use
//       a pure CSS solution with transitions.  The main difficulty is that the background image for the header extends into the menu.
//       Check all commits references #238 for a view into what the menu used to be like, as well as all changes made.
//       In fixing this issue, the resize watcher, as well as all subsequent function calls will need to be removed

(function () {
	'use strict';

	// TODO: rename this to global header, and rename the file as well
	mare.views.GlobalHeader = Backbone.View.extend({
		el: '.global-header', 	

		events: {
			'click .top-nav__button--log-in'	: 'showLogInModal',
			'click .top-nav__button--log-out'	: 'logOut',
			'click .top-nav__button--donate'	: 'donate',
			'click .main-nav__item--main'		: 'toggleMenuExpand'
		},

		initialize: function() {

			// initialize a view for the log in modal if it doesn't already exist
			mare.views.logIn = mare.views.logIn || new mare.views.LogIn();

			// screen width breakpoints (same as _component-menu.scss)
			this.EXTRASMALLSCREEN_WIDTH			= 0;	// mobile breakpoint, mobile menu
			this.SMALLSCREEN_WIDTH				= 655;	// small breakpoint, menu items appear and logo is on two lines
			this.MEDIUMSCREEN_WIDTH				= 765;	// medium breakpoint, logo collapses to one line
			this.MEDIUMLARGESCREEN_WIDTH		= 800;	// medium large breakpoint, logo size increases
			this.LARGESCREEN_WIDTH				= 850;	// desktop breakpoint, font size increases 

			// menu heights @ above breakpoints (same as _component-menu.scss)
			this.EXTRASMALLSCREEN_MENU_HEIGHT 	= 91; 	// mobile header height
			this.SMALLSCREEN_MENU_HEIGHT 		= 132; 	// small header height
			this.MEDIUMSCREEN_MENU_HEIGHT 		= 119;	// medium header height
			this.MEDIUMLARGESCREEN_MENU_HEIGHT	= 128;	// medium large header height
			this.LARGESCREEN_MENU_HEIGHT 		= 134;	// desktop header height

			// DOM cache any commonly used elements to improve performance
			this.$logInContainer 	= $( '.log-in-container' );
			this.$header 			= $( '.global-header' );
			this.$body 				= $( '.body' );
			this.$window 			= $( window );
			this.$submenu 			= $( '.main-nav__items--submenu' );

			this.$window.on( 'resize', this.resizeMenu.bind( this ) ); 		// TODO: convert to event listener, move emit elsewhere

			// initialize global header height so that height will transition on first menu open
			this.$header.css( 'height', this.findBaseHeaderHeight() );
			this.$header.data( 'height', 0 );
		},

		// set timeout for header transition to avoid odd gaps/spacing
		finishTransition: function finishTransition() {
			setTimeout( function(){
			  	$( '.in-transition' ).removeClass( 'in-transition' );
			}, 400 ); // 400ms = duration of header transition
		},

		// return header height based on window width
		findBaseHeaderHeight: function findBaseHeaderHeight() {

			var windowWidth = this.$window.outerWidth(),
				headerHeight = 0;

			if( windowWidth < this.SMALLSCREEN_WIDTH ) {
				headerHeight = this.EXTRASMALLSCREEN_MENU_HEIGHT;
			} else if( windowWidth >= this.SMALLSCREEN_WIDTH && windowWidth < this.MEDIUMSCREEN_WIDTH ) {
				headerHeight = this.SMALLSCREEN_MENU_HEIGHT;
			} else if( windowWidth >= this.MEDIUMSCREEN_WIDTH && windowWidth < this.MEDIUMLARGESCREEN_WIDTH ) {
				headerHeight = this.MEDIUMSCREEN_MENU_HEIGHT;
			} else if( windowWidth >= this.MEDIUMLARGESCREEN_WIDTH && windowWidth < this.LARGESCREEN_WIDTH ) {
				headerHeight = this.MEDIUMLARGESCREEN_MENU_HEIGHT;
			} else {
				headerHeight = this.LARGESCREEN_MENU_HEIGHT;
			}

			return headerHeight;
		},

		// align the submenu with the selected menu item above
		resizeMenu: function resizeMenu( event ) {

			// if we're already in transition, return
			if( $( '.in-transition' ).length > 0 ) {
				return;
			}

			// close the mobile menu if the page exceeds mobile width
			if( this.$window.outerWidth() >= this.SMALLSCREEN_WIDTH && $('#mobile-menu').hasClass('mm-opened') ) {
				$('#mobile-menu').data('mmenu').close();				
			}
			
			var $currentMenuItem 		= $( '.main-nav__item--active' ),
				heightBuffer 			= this.$header.data( 'height' ),
				height 					= this.findBaseHeaderHeight(),
				selectedSubmenuHeight 	= 0;

			// set in transition indicator
			$currentMenuItem.addClass( 'in-transition' );

			// remove any previous adjustments to submenu 
			this.$submenu.removeClass( 'main-nav__items--right' );
			this.$submenu.removeAttr( 'style' );

			// if a menu item is selected
			if( $currentMenuItem.length > 0 ) {
				
				// determine placement of selected the menu item
				var distFromLeft 		= $currentMenuItem.offset().left,
					width 				= $currentMenuItem.children( '.main-nav__link' ).width(),
					widthPlusPadding	= $currentMenuItem.children( '.main-nav__link' ).outerWidth(),
					padding 			= width - widthPlusPadding,
					distFromRight		= this.$window.width() - ( distFromLeft + width ) + padding / 2;

				// if there's not enough room for the submenu to the right, apply right padding and style 
				if( distFromRight < 250 ) {
					this.$submenu.addClass( 'main-nav__items--right' );
					this.$submenu.css( 'padding-right', distFromRight );
				} 

				// otherwise, set the left padding of the submenu
				else {
					this.$submenu.css( 'padding-left', distFromLeft );
				}

				selectedSubmenuHeight 	+= $currentMenuItem.children( '.main-nav__items--submenu' ).outerHeight();
				height 					+= selectedSubmenuHeight;		
			} 

			// set header height and offset
			this.$header.css( 'height', height );
			this.$header.data( 'height', selectedSubmenuHeight );

			if( event.type === 'resize' ) {
				// this is a resize event, we want to resize right away
			  	$( '.in-transition' ).removeClass( 'in-transition' );
			} else {
			  	this.finishTransition();	
			}		
			
		},

		toggleMenuExpand: function toggleMenuExpand( event ) {

			// if we're already in transition, return
			if( this.$( '.in-transition' ).length > 0 ) { 
				return;
			}

			// find current target 
			var $current 		= $( event.currentTarget ),
				$previous 		= $( '.main-nav__item--active' ),
				isPrevious 		= $current.hasClass( 'main-nav__item--active' ),
				activeHeight 	= $previous.children( '.main-nav__items--submenu' ).outerHeight();

			//remove the currently active class
			$previous.removeClass( 'main-nav__item--active' );

			// if the current menu item !== previous menu item, resize for submenu 
			if( !isPrevious ) {
				$current.addClass( 'main-nav__item--active' );

				this.resizeMenu( event );
			} else {
				// set in transition indicator
				$current.addClass( 'in-transition' );

				// set menu height 
				this.$header.css( 'height', this.findBaseHeaderHeight() );

				// remove submenu buffer	
				this.$header.data( 'height', 0 );

				this.finishTransition();
			}			
		},

		/* pass the request for opening the modal to the view in charge of the modal */
		showLogInModal: function showLogInModal( event ) {

			mare.views.logIn.openModal( event );
		},

		logOut: function logOut() {

			window.location.href = '/logout?target=/' + mare.url.redirect;
		},

		donate: function donate() {

			window.location.href = '/donate';
		}
	});
}());