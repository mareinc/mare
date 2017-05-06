( function () {
	'use strict';

	mare.views.LogIn = Backbone.View.extend({
		// this view controls the content of the modal window, create an element to insert into the modal
		tagName: 'section',
		// give the container for our view a class we can hook into
  		className: 'log-in-container',

		initialize: function initialize() {
			// sets the log in target so Express knows what page to route to after handling the log in request
			this.loginTarget = '/';
			// create a hook to access the log in modal contents template
			var html = $( '#log-in-template' ).html();
			// compile the template to be used during rendering/repainting the log in modal
			this.template = Handlebars.compile( html );
			// render the modal to be available when it's requested
			this.render();
			// bind an event to allow closing of the modal
			$( '.modal__close' ).click( this.closeModal );
			// TODO: this adds a class to the modal to adjust it's size.  This should be handled by passing in a size option to a modal view on initialization
			$( '.modal__container' ).addClass( 'modal__container--small' );
		},

		render: function render() {
			// Pass the child model to through the template we stored during initialization
			var html = this.template( { redirectTarget: mare.url.redirect } );
			this.$el.html( html );
			// Render the contents area and tabs
			$( '.modal-container__contents' ).html( this.$el );
			// TODO: due to the child details for the gallery, the gallery by default shows a loading indicator instead of the contents
			// this fixes the display.  Once the modal becomes it's own view that accepts options, hacky fixes like this won't be necessary
			$( '.modal-container__loading' ).hide();
			$( '.modal-container__contents' ).show();
		},
		/* When a child card is clicked, display detailed information for that child in a modal window */
		handleLogInClick: function handleLogInClick( event ) {
			// Open the modal
			this.openModal();
		},

		/* TODO: all modal functions below mirror the calls made in waiting-child-profiles-child-details.js.  Both files need to use
				 a modal.js Backbone view which should handle all this.

		/* Open the modal container */
		openModal: function openModal() {
			$( '.modal__background' ).fadeIn();
			$( '.modal__container' ).fadeIn();

			mare.utils.disablePageScrolling();
		},

		/* Close the modal container */
		closeModal: function closeModal() {

			$( '.modal__background' ).fadeOut();
			$( '.modal__container' ).fadeOut();

			mare.utils.enablePageScrolling();
		}
	});
}());
