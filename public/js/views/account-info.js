(function () {
	'use strict';

	mare.views.AccountInfo = Backbone.View.extend({
		el: '.account-info-container',

		events: {
			'click .save-button'					: 'updateUserInfo',
			'change #is-not-ma-city-checkbox'		: 'toggleOutsideMa',
			'change input, select'					: 'formElementChanged'
		},

		initialize: function initialize() {
			// create a hook to access the section templates
			var html 		= $( '#account-info' ).html();
			// compile the templates to be used during rendering/repainting the different sections
			this.template 	= Handlebars.compile( html );

			// create an object to hold all changes to form data
			this.accountInfoUpdates = {};
		},

		render: function render() {
			// compile the template
			var html = this.template();

			// render the template to the page
			this.$el.html( html );
		},

		// TODO: Update toggle functionality to make it more solid
		toggleOutsideMa: function toggleOutsideMa( e ) {
			var	$outsideMaToggle = $(e.currentTarget),
				$outsideMaGroup = $('.non-ma-city-container'),
				$outsideMaInput = $(''),
				$outsideMaDropdown = $(''),
				$maGroup = $('.city-container'),
				$maInput = $(''),
				$maDropdown = $('');

				if( $outsideMaToggle.is(':checked') ) {
					$outsideMaGroup.removeClass( 'hidden' );
					$maGroup.addClass( 'hidden' );
				} else {
					$outsideMaGroup.addClass( 'hidden' );
					$maGroup.removeClass( 'hidden' );
				}


			// if( $outsideMaGroup.hasClass('hidden') ) {

			// } else {

			// }
		},

		formElementChanged: function formElementChanged( event ) {

			// get the updated form field from the change event
			var $updatedField = $( event.currentTarget );
			// get the field name that should be updated
			var updatedFieldName = $updatedField.data( 'field-name' );

			// get the updated value
			if ( $updatedField.data( 'field-type' ) === 'array' ) {

				var updatedValue = [];

				// if the field type is an array, construct the updated array value
				// from the values of the other input elements with the same name
				$( 'input[ name=\'' + $updatedField.attr( 'name' ) + '\' ]' ).each( function( index, element ) {

					// if the element is checked add it to the updatedValue array
					if ( element.checked ) {

						updatedValue.push( element.value );
					}
				});
			} else {

				// if the field is a single checkbox
				if ( $updatedField.attr( 'type' ) === 'checkbox' ) {

					// set the value based on the checked status
					var updatedValue = $updatedField.is( ':checked' );
				} else {

					// for all other field types, simply get the updated value of the form field
					var updatedValue = $updatedField.val();
				}
			}

			// create an update record with the field name that has changed and the new value
			this.accountInfoUpdates[ updatedFieldName ] = updatedValue;
		},

		hide: function hide() {
			// hide the section
			this.$el.hide();
			// remove the contents of the view
			this.$el.empty();
			// NOTE: if any events are bound to DOM elements, they should be explicitly removed here as well
		},

		show: function show() {
			this.$el.show();
		},

		updateUserInfo: function updateUserInfo( event ) {
			// fetch the form data
			var data = this.accountInfoUpdates;

			// send a put request to the server with the updated user information
			$.ajax({
				type: 'PUT',
				url: 'account/user-info',
				data: data,
				success: function( responseData ) {

					// TODO: flash message with error/success status
					if ( responseData.status === 'error' ) {
						console.error( 'there was an error updating the account info' );
					} else {
						console.log( 'account info successfully updated' );
					}
				}
			});
		}
	});
}());
