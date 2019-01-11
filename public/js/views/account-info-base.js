(function () {
	'use strict';

	mare.views.AccountInfoBase = Backbone.View.extend({
		el: '.account-info-container',

		events: function() {

			// set events common to all AccountInfo views
			var events = {
				'click .save-button'	: 'updateUserInfo',
				'change input, select'	: 'formElementChanged'
			};

			// add any events defined in the current child view
			$.extend( events, this.childEvents );
			return events;
		},

		initialize: function initialize() {
			
			// initialize parsley validation on input elements
			this.$el.find('input').parsley();
			
			// create an object to hold all changes to form data
			this.accountInfoUpdates = {};
		},

		hide: function hide() {
			this.$el.hide();
		},

		show: function show() {
			this.$el.show();
		},

		formElementChanged: function formElementChanged( event ) {

			// get the updated form field from the change event
			var $updatedField = $( event.currentTarget );
			// get the field name that should be updated
			var updatedFieldName = $updatedField.data( 'field-name' );
			// create a placeholder for the updated value
			var updatedValue;

			// check to ensure the form field is mapped to a model field
			if ( updatedFieldName ) {

				if ( $updatedField.data( 'field-type' ) === 'select-multiple' ) {

					// handle fields that are saved as multiple selections of a set of values, usually represented as checkboxes
					updatedValue = [];

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
						updatedValue = $updatedField.is( ':checked' );
					} else {

						// for all other field types, simply get the updated value of the form field
						updatedValue = $updatedField.val();
					}
				}

				// create an update record with the field name that has changed and the new value
				this.accountInfoUpdates[ updatedFieldName ] = updatedValue;
			} else {

				// display a warning that the updated field could not be processed
				console.warn( 'form field is not properly configured to capture updates' );
			}
		},
		
		isValid: function () {
			var isValid = true;
			
			// validate all input elements
			this.$el.find('input').each( function() {
				if ( $(this).parsley().validate() !== true ) {
					// focus the first invalid element
					if ( isValid ) {
						$(this).focus();
					}
					isValid = false;
				}
			});
			
			return isValid;
		},

		updateUserInfo: function updateUserInfo( event ) {
			// fetch the form data
			var data = this.accountInfoUpdates;
			
			// check if the form is valid
			if ( !this.isValid() ) {
				return;
			}

			// send a put request to the server with the updated user information
			$.ajax({
				type: 'PUT',
				url: 'account/user-info',
				data: data,
				success: function( responseData ) {

					// display a flash message with the resulting status of the update action
					mare.views.flashMessages.initializeAJAX( responseData.flashMessage );
				}
			});
		}
	});
}());
