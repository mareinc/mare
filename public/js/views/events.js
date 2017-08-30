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
			'click .events__register-button'					: 'showEventRegistrationForm'
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
		}
	});
}());