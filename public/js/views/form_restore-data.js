(function () {
	'use strict';

	mare.views.RestoreFormData = Backbone.View.extend({
		el: '.restore-form-data__container',

		events: {
			'click .restore-form-data__restore'		: 'handleRestoreClick',
			'click .restore-form-data__ignore'		: 'handleHideClick'
		},

		initialize: function( options ) {
			// make the options accessible to the rest of the view
			this.options = options;

			options.form.on( 'formInputChanged', this.hide, this );
			options.form.on( 'formDataRestored', this.hide, this );
			options.form.on( 'formSubmitted', this.removeFormDataFromLocalStorage, this );

			// create input type constants to allow for better event binding
			this.setElementConstants();

			// bind all form elements to trigger data saving to local storage on form change
			this.addFormSaving( options.formClass );
			// get any existing form data saved in local storage
			this.savedFormData = this.getFormDataFromLocalStorage( options.formClass );

			if( this.savedFormData ) {
				this.show();
			}
		},

		show: function show() {
			this.$el.removeClass( 'hidden' );
		},

		hide: function hide() {
			this.$el.addClass( 'hidden' );
		},

		handleHideClick: function handleHideClick() {
			this.hide();
		},

		handleRestoreClick: function handleRestoreClick() {
			this.trigger( 'restore' );
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

			var formInputs = $( '.' + formClass + ' :input' );

			formInputs.each( function( index, input) {

				var inputType = $( input ).attr( 'type' )
					? $( input ).attr( 'type' ).toLowerCase()
					: 'select';

				if( this.constants.TEXT_INPUTS.includes( inputType ) ) {

					$( '.' + formClass + ' :input' ).keyup( function() {

						var formAsObject = this.convertFormToObject( formClass );
						var formData = JSON.stringify( formAsObject );
		
						this.saveFormDataToLocalStorage( formClass, formData );
		
						$( '.' + formClass ).trigger( 'formInputChanged' );

					}.bind( this ) );

				} else if (this.constants.NON_TEXT_INPUTS.includes( inputType ) ) {

					$( '.' + formClass + ' :input' ).change( function() {

						var formAsObject = this.convertFormToObject( formClass );
						var formData = JSON.stringify( formAsObject );
		
						this.saveFormDataToLocalStorage( formClass, formData );
		
						$( '.' + formClass ).trigger( 'formInputChanged' );

					}.bind( this ) );
				}

			}.bind( this ) );
		},

		removeFormSaving: function removeFormSaving( formClass ) {
			$( '.' + formClass ).unbind( 'change' );
		},

		restore: function restore( formClass ) {
			var savedFormData = JSON.parse( this.getFormDataFromLocalStorage( formClass ) );

			_.each( savedFormData, function( value, key ) {
				// an input will either be of type radio button, or something else
				var targetElement = $( '[name="' + key + '"]' );
				var targetRadioButton = $( '[name="' + key + '"][value="' + value + '"]' )[0];
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
			key
				? localStorage.removeItem( key )
				: localStorage.removeItem( this.options.formClass );
		},

		setElementConstants: function setElementConstants() {
			this.constants = {
				NON_TEXT_INPUTS: [ 'button', 'checkbox', 'file', 'hidden', 'image', 'password', 'radio', 'select' ],
				TEXT_INPUTS: [ 'color', 'date', 'datetime-local', 'email', 'month', 'number', 'range', 'search', 'tel', 'text', 'time', 'url', 'week', 'datetime' ]
			};
		}
	});
}());