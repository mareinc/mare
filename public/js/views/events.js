/* TODO: break the events list and event code out into separate views */
(function () {
	'use strict';

	mare.views.Events = Backbone.View.extend({
		el: 'body',

        events: {
			'mouseenter .card-list__collapsible-trigger-container'	: 'showExpandCollapseIndicator',
			'mouseleave .card-list__collapsible-trigger-container'	: 'hideExpandCollapseIndicator',
			'click .card-list__collapsible-trigger-container'		: 'toggleCollapsibleList',
            'click .events__navigation-button'						: 'navigate',
			'click .events__register-button'						: 'showEventRegistrationForm',
			'click .events__edit-registration-button'				: 'editEventRegistrationForm'
		},
		
		initialize: function initialize() {
			// initialize a view for the event registration modal if it doesn't already exist
			mare.views.eventRegistrationForm = mare.views.eventRegistrationForm || new mare.views.EventRegistrationForm();
		},
		
		// TODO: consider putting this in a more global space since it's used for button navigation
        navigate: function navigate( event ) {
        	window.location.href = $( event.currentTarget ).data( 'url' );
		},

		// NOTE: show and hide were used instead of toggle due to hovering over different sub-elements triggering the toggle
		showExpandCollapseIndicator: function showExpandCollapseIndicator( event ) {
			this.$( event.currentTarget )
				.find( '.card-list__collapsible-trigger-indicator' )
				.addClass( 'card-list__collapsible-trigger-indicator--visible' );
		},

		hideExpandCollapseIndicator: function hideExpandCollapseIndicator( event ) {
			this.$( event.currentTarget )
				.find( '.card-list__collapsible-trigger-indicator' )
				.removeClass( 'card-list__collapsible-trigger-indicator--visible' );
		},

		toggleCollapsibleList: function toggleCollapsibleList( event ) {
			// update the indicator text associated with the collapsible list to match whether the list is expanded or not
			this.toggleCollapsibleIndicatorText( event.currentTarget );
			// toggle the class on the collapsible trigger that determines whether it's been clicked or not
			this.$( event.currentTarget )
				.toggleClass( '.card-list__collapsible-trigger-container--active' );
			// toggle the class on the collapsible list that determines whether it's expanded or not
			this.$( event.currentTarget )
				.siblings( '.card-list__collapsible-content' )
				.toggleClass( 'card-list__collapsible-content--expanded' );
		},

		toggleCollapsibleIndicatorText: function toggleCollapsibleIndicatorText( target ) {
			// find the indicator text associated with the clicked collapsible list toggle
			var indicator = this.$( target ).find( '.card-list__collapsible-trigger-indicator' );
			// determine what the new text should say based on the state of the collapsible list
			var newIndicatorText = indicator.html() === '+' ? '-' : '+';
			// update the indicator text
			indicator.html( newIndicatorText );
		},

		showEventRegistrationForm: function showEventRegistrationForm( event ) {
			// pass the request for opening the modal to the view in charge of the modal
			mare.views.eventRegistrationForm.handleRegisterButtonClick( event, 'register' );
		},

		editEventRegistrationForm: function editEventRegistrationForm( event ) {
			// pass the request for opening the modal to the view in charge of the modal
			mare.views.eventRegistrationForm.handleRegisterButtonClick( event, 'edit' );
		}
	});
}());
