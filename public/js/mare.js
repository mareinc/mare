(function() {
    'use strict';

    window.mare = {
        models: {},
        collections: {},
        views: {},
        routers: {},
        settings: {},
        promises: {},
        permissions: {},
        url: {},
        utils: {

        	storeUrlInfo: function storeUrlInfo() {
				var host		= window.location.host,
					pathName	=  window.location.pathname.substr( 1 ), // get the pathname without the leading '/'
					pathArray	= pathName.split( '/' ),
					href		= window.location.href;

				// store relevant url information in mare namespace
				mare.url.protocol	= window.location.protocol;
				mare.url.siteArea	= pathArray[ 0 ];
				mare.url.page		= pathArray[ 1 ];
				mare.url.target		= pathArray[ 2 ];

				// store redirect information for log in / log out actions
				mare.url.redirect = '';
				mare.url.redirect += mare.url.siteArea ? mare.url.siteArea : '';
				mare.url.redirect += mare.url.page ? '/' + mare.url.page : '';
				mare.url.redirect += mare.url.target ? '/' + mare.url.target : '';
        	},

			bindTouch: function bindTouch() {
				// bind adding of 'hover' class to tap vs hover depending on whether it is a touch enabled device
				if( Modernizr.touch ) {
					$( '.nav li' ).unbind('mouseenter mouseleave');
					$( '.nav li a.parent' ).unbind( 'click' );
					$( '.nav li .more' ).unbind( 'click' ).bind( 'click', function() {
						$( this ).parent( 'li' ).toggleClass( 'hover' );
					});

				} else {
					$( '.nav li' ).removeClass( 'hover' );
					$( '.nav li a' ).unbind( 'click' );
					$( '.nav li' ).unbind( 'mouseenter mouseleave' ).bind( 'mouseenter mouseleave', function() {
						// must be attached to li so that mouseleave is not triggered when hovering over a submenu
						$( this ).toggleClass( 'hover' );
					});
				}
			},

			enablePageScrolling: function enablePageScrolling() {
				$( 'body' ).removeClass( 'scrolling-disabled' );
			},

			disablePageScrolling: function disablePageScrolling() {
				$( 'body' ).addClass( 'scrolling-disabled' );
			},

			enableButton: function enableButton( $button ) {
				$button.removeAttr( 'disabled' );
				$button.removeClass( 'button--disabled' );
			},

			disableButton: function disableButton( $button ) {
				$button.attr( 'disabled', 'disabled' );
				$button.addClass( 'button--disabled' );
			},

			registerHandlebarsHelpers: function registerHandlebarsHelpers() {
				Handlebars.registerHelper( 'ifeq', function( a, b, opts ) {
					if( a === b )
						return opts.fn( this );
					else
						return opts.inverse( this );
				});
			}
		}
	};
}());
