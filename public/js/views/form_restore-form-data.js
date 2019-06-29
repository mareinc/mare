(function () {
	'use strict';

	mare.views.RestoreFormData = Backbone.View.extend({
		el: '.restore-form-data__container',

		events: {
			'click .restore-form-data__restore'		: 'handleRestoreClick',
			'click .restore-form-data__ignore'		: 'handleHideClick'
		},

		initialize: function( options ) {

			options.form.on( 'formDataRestored', this.hide, this );
			options.form.on( 'formInputChanged', this.hide, this );

			// bind all form elements to trigger data saving to local storage on form change
			mare.utils.addFormSaving( options.formClass );
			// get any existing form data saved in local storage
			this.savedFormData = mare.utils.getFormDataFromLocalStorage( options.formClass );

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
		}
	});
}());