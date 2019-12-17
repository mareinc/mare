(function () {
	'use strict';

	mare.views.EditChild = Backbone.View.extend({
		el: '.edit-child-form-container',

		events: {
			'change #is-not-ma-city-checkbox'		: 'toggleCitySelect',
			'change [name="isPartOfSiblingGroup"]'	: 'toggleSiblingNamesTextbox',
			'change #registered-children-edit'		: 'loadRegisteredChild',
			'change .edit-child-form-body input'	: 'onChildDataChanged',
			'change .edit-child-form-body select'	: 'onChildDataChanged',
			'change .edit-child-form-body textarea'	: 'onChildDataChanged'
		},

		initialize: function() {
			// DOM cache commonly used elements
			this.$MACityContainer		= this.$( '.city-container' );
			this.$NonMACityContainer	= this.$( '.non-ma-city-container' );
			this.$siblingNamesContainer	= this.$( '.sibling-names-container' );
			this.$updateChildFormBody	= this.$( '.edit-child-form-body' );
			this.$submitButton			= this.$( '#btn-update-child-data' );
			// create a placeholder to store initial state of existing child data
			this.existingChildData = {};
			// create a placeholder to store changes to existing child data
			this.updatedChildData = {};
		},

		toggleCitySelect: function toggleCitySelect( event ) {
				// toggle showing of the MA city dropdown menu
				this.$MACityContainer.toggleClass( 'hidden' );
				// toggle showing of the city free text field
				this.$NonMACityContainer.toggleClass( 'hidden' );
		},

		toggleSiblingNamesTextbox: function toggleSiblingNamesTextbox( event ) {
			var value = this.$('[name="isPartOfSiblingGroup"]:checked').val();

			// if the child is part of a sibling group
			if( value === 'Yes' ) {
				this.$siblingNamesContainer.removeClass( 'hidden' );
			// otherwise, if the child is not part of a sibling group
			} else {
				this.$siblingNamesContainer.addClass( 'hidden' );
			}
		},

		loadRegisteredChild: function loadRegisteredChild( event ) {

			// get the selected option from the registered child select
			var $selectedOption = $( event.currentTarget ).find( 'option:selected' );
			var selectedOptionText = $selectedOption.text();

			// if the selected option is not empty...
			if ( selectedOptionText !== '' ) {

				var view = this;
				
				// get the child details from the selected option
				var childDetails = $selectedOption.data( 'child-details' );

				// pre-fill form fields with child data
				_.each( childDetails, function( value, key ) {

					// add each datum to the existing child data dictionary
					view.existingChildData[ key ] = value;
					
					// NOTE: the double quotes are necessary to handle checkboxes with [] in the name
					// an input will either be of type radio button, or something else
					var targetElement = mare.views.editChild.$( '[name="' + key + '"]' );
					var targetRadioButton = mare.views.editChild.$( '[name="' + key + '"][value="' + value + '"]' )[0];
					// restore radio buttons
					if( targetRadioButton && targetRadioButton.type === 'radio' ) {
						targetRadioButton.checked = true;
	
						if( $( targetRadioButton ).data( 'triggerOnRestore' ) === 'change' ) {
							$( targetRadioButton ).trigger( 'change' );
						}
					} else {
						// NOTE: this handles checking single checkboxes
						if( targetElement.attr( 'type' ) === 'checkbox' && targetElement.length === 1 ) {
							if( value === 'on' ) {
								// check the checkbox
								targetElement.prop( 'checked', true );
								// trigger change event
								if( targetElement.data( 'triggerOnRestore' ) === 'change' ) {
									targetElement.trigger( 'change' );
								}
							}
						} else {
							// restore data for non radio/checkbox inputs
							targetElement.val( value );
							// trigger change event
							if( targetElement.data( 'triggerOnRestore' ) === 'change' ) {
								targetElement.trigger( 'change' );
							}
						}
					}
				});

				// remove any existing data from the child edit form
				$( '.edit-child-form input[type="hidden"]' ).remove();
				// add child name and registration to edit form
				$( '.edit-child-form' ).prepend( 
					'<input type="hidden" name="childName" value="' + childDetails.name + '">'
				);
				$( '.edit-child-form' ).prepend( 
					'<input type="hidden" name="registrationNumber" value="' + childDetails.registrationNumber + '">'
				);

				// show the form body
				this.$updateChildFormBody.removeClass( 'hidden' );

			// if the selected option is empty...
			} else {

				// hide the form body
				this.$updateChildFormBody.addClass( 'hidden' );
				// reset the existing data
				this.existingChildData = {};
			}

			// disable the submit button
			this.$submitButton.attr( 'disabled', true );
			this.$submitButton.addClass( 'button--disabled' );
		},

		onChildDataChanged: function onChildDataChanged( event ) {

			// ensure the submit button is enabled
			this.$submitButton.removeAttr( 'disabled' );
			this.$submitButton.removeClass( 'button--disabled' );
			// get the field name of the child data that was changed
			var fieldName = event.currentTarget.name;
			// check if the field represents an array of values or a single value
			var isArrayField = fieldName.includes( '[]' );
			// check for pre-existing child data for the field that was updated ( current state of child model )
			var existingData = this.existingChildData[ fieldName ];
			// create a placeholder for the updated data
			var newData;

			// if the field represents an array of data...
			if ( isArrayField ) {

				// context: all array fields on the form are checkbox groups, so all logic will be written with that assumption

				// convert existing data from id values to their label values
				var existingLabelData = _.map( existingData, function( datum ) {
					return $( '.edit-child-form-body input:checkbox[value="' + datum + '"]' ).parent().text().trim();
				});

				// check for existing updates to the field ( any update previously made during this session )
				var existingUpdatedData = $( '.edit-child-form input[name="' + fieldName + '"]' ).map( function() {
					return $( this ).val();
				}).get();

				// get the most recent version of the data, either the pre-existing data on the child model
				// or the updated data from changes made during the current session
				var mostRecentData = existingUpdatedData.length === 0
					? _.clone( existingLabelData )
					: existingUpdatedData;

				// get the new value for the field that was updated
				newData = $( event.currentTarget ).parent().text().trim();
				
				// if the checkbox is checked...
				if ( event.currentTarget.checked ) {

					// add the datum to the dataset
					mostRecentData.push( newData );

				// if the checkbox is unchecked...
				} else {

					// remove the datum from the dataset
					mostRecentData = _.filter( mostRecentData, function( datum ) { return datum !== newData; } );
				}

				// ensure all datum in the dataset are unique
				mostRecentData = _.uniq( mostRecentData );

				// remove any existing updates from the edit form
				$( '.edit-child-form input[name="' + fieldName + '"]' ).remove();

				// if the most recent data does not match the existing data...
				if ( !_.isEqual( existingLabelData, mostRecentData ) ) {
					// add all new datum to the edit form
					_.each( mostRecentData, function( datum ) {
						$( '.edit-child-form' ).prepend( 
							'<input type="hidden" ' 
							+ 'name="' + fieldName 
							+ '" value="' + datum
							+ '">'
						);
					});
				}
				
			// if the field represents a single datum
			} else {

				// remove any existing updates from the edit form
				$( '.edit-child-form input[name="' + fieldName + '"]' ).remove();

				// get the new value for the field that was updated
				newData = event.currentTarget.value;

				// if new data doesn't match the existing data...
				if ( existingData !== newData ) {

					// get the type of input that was updated
					var inputType = event.currentTarget.type;
					
					switch ( inputType ) {
						// if the input is a radio button use the label of the input as the value to send for the update email
						// ( these are fields that have IDs for values, which are not human-readable )
						case 'radio':
							newData = $( event.currentTarget ).parent().text().trim();
							break;
						// if the input is a select use the label of the selected option as the value to send for the update email
						// ( these are fields that have IDs for values, which are not human-readable )
						case 'select-one':
							console.log(event.currentTarget);
							newData = $( event.currentTarget ).find( 'option:selected' ).text().trim();
							break;
						// otherwise, use the current value of newData
						default:
							break; 
					}

					// add the updated data to the edit form
					$( '.edit-child-form' ).prepend( 
						'<input type="hidden" ' 
						+ 'name="' + fieldName 
						+ '" value="' + newData 
						+ '">'
					);
				}
			}
		}
	});
}());