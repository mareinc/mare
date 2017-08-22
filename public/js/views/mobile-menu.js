/* TODO: this file needs some serious work, what it controls (opening/closing handled elseware) needs to be looked at */
( function () {
	'use strict';

	mare.views.MobileMenu = Backbone.View.extend({
		el: '#mobile-menu',

		events: {
			'click .mm-next' 					: 'adjustLogoSize',
			'click .mm-prev' 					: 'initLogoSize',
			'click .top-nav__button--log-in'	: 'showLogInModal',
			'click .top-nav__button--log-out'	: 'logOut'
		},

		initialize: function() {
			/* TODO: these are sharing classes with the top nav, they should either be made more generic, or renamed to be specific to the mobile menu */
			/* TODO: donation clicks for the global header are handled in Backbone instead of an href, it should be consistent one way or the other across the two views */
			var content = [ '<a class="top-nav__link top-nav__item top-nav__button top-nav__button--green" href="/donate">Donate</a>' ];
			
			// store whether the user is logged in.  This is passed as a data attribute on the mobile menu because the menu is rendered client-side instead of server-side
			var isLoggedIn = this.$el.data( 'is-logged-in' );

			// push the correct markup into the content to display at the bottom of the mobile menu
			if( isLoggedIn ) {
				content.push( '<a class="top-nav__link top-nav__item top-nav__button top-nav__button--log-out">Log Out</a>' );
			} else {
				content.push( '<a class="top-nav__link top-nav__item top-nav__button top-nav__button--log-in">Log In</a>' );
			}

			// Initialize a view for the log in modal if it doesn't already exist
			mare.views.logIn = mare.views.logIn || new mare.views.LogIn();

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
						"content": content
					}
				]
			});
			// allows the mobile menu to be seen (it was hidden to prevent it flashing on the screen during page load)
			this.$el.removeClass( 'hidden' );

			// DOM cache elements 
			this.$logo = $( '.mm-logo' );
			this.$panel = $( '.mm-panel' );
			this.$navbar = $( '.mm-navbar-size-2' );

			// remove the title from the landing page of the mobile menu
			this.adjustMobileMenu();			
		},

		initLogoSize: function initLogoSize() {
			this.$logo.removeClass( 'mm-logo--smaller' );
			this.$panel.removeClass( 'mm-panel--less-top' );
			this.$navbar.removeClass( 'mm-navbar-size-2--shorter' );
		},

		adjustLogoSize: function adjustLogoSize() {
			this.$logo.toggleClass( 'mm-logo--smaller' );
			this.$panel.toggleClass( 'mm-panel--less-top' );
			this.$navbar.toggleClass( 'mm-navbar-size-2--shorter' );
		},

		adjustMobileMenu: function adjustMobileMenu() {
            this.$( '#mm-1 .mm-navbar' ).remove();
        },
		/* pass the request for opening the modal to the view in charge of the modal */
		showLogInModal: function showLogInModal( event ) {

			mare.views.logIn.openModal( event );
			this.closeMenu();
		},

		closeMenu: function closeMenu() {
			this.$( '.mm-close' ).click()
		},

		logOut: function logOut() {

			window.location.href = '/logout?target=/' + mare.url.redirect;
		}
	});
}());