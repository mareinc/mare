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
				var host		= window.location.host;
				var pathName	=  window.location.pathname.substr(1); // get the pathname without the leading '/'
				var pathArray	= pathName.split( '/' );

				// Store relevant url information in mare namespace
				mare.url.protocol	= window.location.protocol;
				mare.url.siteArea	= pathArray[0];
				mare.url.page		= pathArray[1];
        	},

			bindTouch: function bindTouch() {
				// Bind adding of 'hover' class to tap vs hover depending on whether it is a touch enabled device
				if (Modernizr.touch) {
					$(".nav li").unbind('mouseenter mouseleave');
					$(".nav li a.parent").unbind('click');
					$(".nav li .more").unbind('click').bind('click', function() {
						$(this).parent("li").toggleClass("hover");
					});

				} else {
					$(".nav li").removeClass("hover");
					$(".nav li a").unbind('click');
					$(".nav li").unbind('mouseenter mouseleave').bind('mouseenter mouseleave', function() {
						// must be attached to li so that mouseleave is not triggered when hovering over a submenu
						$(this).toggleClass('hover');
					});
				}
			},

			enablePageScrolling: function enablePageScrolling() {
				$('html, body').removeClass('scrolling-disabled');
			},

			disablePageScrolling: function disablePageScrolling() {
				$('html, body').addClass('scrolling-disabled');
			},
			// TODO: Once the button code is fixed, this should bind to the .button--disabled class
			enableButton: function enableButton($button) {
				$button.removeAttr('disabled');
				$button.removeClass('card__button--disabled');
			},
			// TODO: Once the button code is fixed, this should bind to the .button--disabled class
			disableButton: function disableButton($button) {
				$button.attr('disabled', 'disabled');
				$button.addClass('card__button--disabled');
			}
		}
	};
}());
