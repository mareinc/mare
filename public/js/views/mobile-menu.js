( function () {
	'use strict';

	mare.views.MobileMenu = Backbone.View.extend({
		el: '#mobile-menu',

		events: {
			'click .mobile-menu__button--log-in'	: 'showLogInModal',
			'click .mobile-menu__button--log-out'	: 'logOut'
		},

		initialize: function() {
			/* TODO: these are sharing classes with the top nav, they should either be made more generic, or renamed to be specific to the mobile menu */
			/* TODO: donation clicks for the global header are handled in Backbone instead of an href, it should be consistent one way or the other across the two views */
			var content = [ '<a class="mobile-menu__button mobile-menu__button--green" href="/donate">Donate</a>' ];
			
			// store whether the user is logged in.  This is passed as a data attribute on the mobile menu because the menu is rendered client-side instead of server-side
			var isLoggedIn = this.$el.data( 'is-logged-in' );

			// create the buttons to display at the bottom of the mobile menu
			if( isLoggedIn ) {
				content.push( '<a class="mobile-menu__button mobile-menu__button--log-out">Log Out</a>' );
			} else {
				content.push( '<a class="mobile-menu__button mobile-menu__button--log-in">Log In</a>' );
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
			// remove the title from the landing page of the mobile menu
			this.removeDefaultHeader();			
		},

		removeDefaultHeader: function removeDefaultHeader() {
            this.$( '#mm-1 .mm-navbar' ).remove();
        },

		showLogInModal: function showLogInModal( event ) {
			mare.views.logIn.openModal( event );
			setTimeout( this.closeMenu, 200 );
		},

		closeMenu: function closeMenu() {
			console.log('called');
			this.$('.mm-btn_close > .mm-sronly').click();
		},

		logOut: function logOut() {
			window.location.href = '/logout?target=/' + mare.url.redirect;
		}
	});
}());