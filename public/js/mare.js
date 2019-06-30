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

			convertFormToObject: function convertFormToObject( formClass ) {
				var allFormFields = $( '.' + formClass ).serializeArray();

				var formObject = {};

				allFormFields.map( function( field ) {
					if( field.name.indexOf('[]') === -1 ) {
						formObject[ field.name ] = field.value;
					} else {

						if( formObject[ field.name ] ) {
							formObject[ field.name ].push( field.value );
						} else {
							formObject[ field.name ] = [ field.value ];
						}
					}
				});

				return formObject;
			},

			addFormSaving: function addFormSaving( formClass ) {
				$( '.' + formClass + ' :input' ).change( function() {

					var formAsObject = mare.utils.convertFormToObject( formClass );
					var formData = JSON.stringify( formAsObject );

					mare.utils.saveFormDataToLocalStorage( formClass, formData );

					$( '.' + formClass ).trigger( 'formInputChanged' );
				});
			},

			removeFormSaving: function removeFormSaving( formClass ) {
				$( '.' + formClass ).unbind( 'change' );
			},

			restoreFormData: function restoreFormData( formClass, view ) {
				var savedFormData = JSON.parse( mare.utils.getFormDataFromLocalStorage( formClass ) );

				_.each( savedFormData, function( value, key ) {
					// an input will either be of type radio button, or something else
					var targetElement = view.$( '[name="' + key + '"]' );
					var targetRadioButton = view.$( '[name="' + key + '"][value="' + value + '"]' )[0];
					// restore radio buttons
					if( targetRadioButton && targetRadioButton.type === 'radio' ) {
						targetRadioButton.checked = true;

						if( $( targetRadioButton ).data( 'triggerOnRestore' ) === 'change' ) {
							$( targetRadioButton ).trigger( 'change' );
						}
					} else {			
						// NOTE: the double quotes are necessary to handle checkboxes with [] in the name
						// restore non-radio button inputs
						targetElement.val( value );

						if( targetElement.data( 'triggerOnRestore' ) === 'change' ) {
							targetElement.trigger( 'change' );
						}
					}
				});
			},

			saveFormDataToLocalStorage: function saveFormDataToLocalStorage( key, formData ) {
				localStorage.setItem( key, formData );
			},

			getFormDataFromLocalStorage: function getFormDataFromLocalStorage( key ) {
				return localStorage.getItem( key );
			},

			removeFormDataFromLocalStorage: function removeFormDataFromLocalStorage( key ) {
				localStorage.removeItem( key );
			}
		}
	};
}());
