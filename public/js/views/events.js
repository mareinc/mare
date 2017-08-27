/* TODO: break the events list and event code out into separate views */
(function () {
	'use strict';

	mare.views.Events = Backbone.View.extend({
		el: 'body',

        events: {
            'click .events__category-card'						: 'navigate',
			'click .events__create-event-button'				: 'navigate',
			'click .events__create-account-button'				: 'navigate',
            'click .events__show-details-button'				: 'navigate',
			'click .events__register-button'					: 'showEventRegistrationForm',
            'click .events__unregister-button'					: 'unregister'
		},
		
		initialize: function initialize() {
			// initialize a view for the event registration modal if it doesn't already exist
			mare.views.eventRegistrationForm = mare.views.eventRegistrationForm || new mare.views.EventRegistrationForm();
		},
		
		// TODO: consider putting this in a more global space since it's used for button navigation
        navigate: function navigate( event ) {
        	window.location.href = $( event.currentTarget ).data( 'url' );
		},

		showEventRegistrationForm: function showEventRegistrationForm( event ) {
			// pass the request for opening the modal to the view in charge of the modal
			mare.views.eventRegistrationForm.handleRegisterButtonClick( event );
			
			// be sure to bind a special unregister class for social workers to allow additional processing like removing "brought by" info
		},

		/* special function called when the unregister button linked with logged in social worker is clicked */
		unregisterSocialWorker: function unregisterSocialWorker() {
			// use the subview to tear down the event binding
			// call a special version of the event unregister API call to not just unregister the user, but remove additional details saved during registration
			// on success, do what the regular unregister button does in changing the button text and activating it (maybe pull to a common function)
			// be sure to unbind the special unregister class and rebind the special register class
		},
		// TODO: there's no need to have a separate register and unregister function, simplify this file
        register: function register() {
			// store a reference to this for insde callbacks where context is lost
        },

        unregister: function unregister() {
			// create a promise to resolve once the user has been successfully unregistered
        },

		bindRegisterButton: function bindRegisterButton() {

			$( '.events__register-button' ).on( 'click', this.register.bind( this ) );

		},

		bindUnregisterButton: function bindUnregisterButton() {

			$( '.events__unregister-button' ).on( 'click', this.unregister.bind( this ) );
		},

		unbindRegisterButton: function unbindRegisterButton() {
			// unbind all events on the register button
			$( '.events__register-button' ).off();

		},

		unbindUnregisterButton: function unbindUnregisterButton() {
			// unbind all events on the unregister button
			$( '.events__unregister-button' ).off();

		}
	});
}());