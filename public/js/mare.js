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
				var pathName =  window.location.pathname.substr( 1 ), // get the pathname without the leading '/'
					pathArray = pathName.split( '/' );

				// store relevant url information in mare namespace
				mare.url.protocol = window.location.protocol;
				mare.url.siteArea = pathArray[ 0 ];
				mare.url.page = pathArray[ 1 ];
				mare.url.target = pathArray[ 2 ];

				// store redirect information for log in / log out actions
				mare.url.redirect = '';
				mare.url.redirect += mare.url.siteArea ? mare.url.siteArea : '';
				mare.url.redirect += mare.url.page ? '/' + mare.url.page : '';
				mare.url.redirect += mare.url.target ? '/' + mare.url.target : '';

				// store the host name
				mare.host = window.location.host;

				mare.href = window.location.href;
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
					return a === b ?
						opts.fn( this ) :
						opts.inverse( this );
				});
			},

			initializeModalPrintSupport: function initializeModalPrintSupport( modalContents, styleSheetID ) {
				// create a new stylesheet
				var printStylesheet = document.createElement( 'style' );
				printStylesheet.type = 'text/css';
				// assign an ID so the stylesheet can be removed later
				printStylesheet.id = styleSheetID;

				// set screen styles to ensure the printable content isn't visible
				var screenStyles = '@media screen { #printSection { display: none; } }';
				// set print styles to display only the printable section
				var printStyles = '@media print { body * { display: none; } #printSection, #printSection * { display: block; } #printSection { position: absolute; left: 0; top: 0; } }';
				// concatenate the two styles
				var css = ''.concat( screenStyles, ' ', printStyles );
				// append the styles to the stylesheet
				printStylesheet.appendChild( document.createTextNode( css ) );
				// append the stylesheet to the document head
				document.head.appendChild( printStylesheet );

				// see if a print section has already been added to the DOM
				var printSection = document.getElementById( 'printSection' );
				// if not, create and append a print section
				if ( !printSection ) {
					printSection = document.createElement( 'div' );
					printSection.id = 'printSection';
					document.body.appendChild( printSection );
				}
				// ensure the contents of the print section are empty
				printSection.innerHTML = '';
				// append the modal contents to the print section
				printSection.appendChild( modalContents );
			}
		}
	};
}());
