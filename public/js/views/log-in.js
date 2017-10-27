( function () {
	'use strict';

	mare.views.LogIn = Backbone.View.extend({
		// this view controls the content of the modal window, create an element to insert into the modal
		tagName: 'section',
		// give the container for our view a class we can hook into
  		className: 'log-in-container',

		initialize: function initialize() {
			// create a hook to access the log in modal contents template
			var html = $( '#log-in-template' ).html();
			// compile the template to be used during rendering/repainting the log in modal
			this.template = Handlebars.compile( html );
		},
		// events need to be bound every time the modal is opened, so they can't be put in an event block
		bindEvents: function bindEvents() {
			// bind an event to allow closing of the modal
			$( '.modal__close' ).click( this.closeModal.bind( this ) );
		},
		// events need to be unbound every time the modal is closed
		unbindEvents: function unbindEvents() {
			$( '.modal__close' ).unbind( 'click' );
		},

		render: function render() {
			// Pass the child model to through the template we stored during initialization
			var html = this.template( { target: mare.url.redirect } );
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
			// populate the modal with the log in template
			this.render();
			// TODO: this adds a class to the modal to adjust it's size.  This should be handled by passing in a size option to a modal view on initialization
			$( '.modal__container' ).addClass( 'modal__container--small' );
			$( '.modal-container__contents' ).addClass( 'modal-container__contents--vertically-centered' );

			$( '.modal__background' ).fadeIn();
			$( '.modal__container' ).fadeIn();

			mare.utils.disablePageScrolling();
			// Bind click events for the newly rendered elements
			if( mare.views.childDetails ) {
				mare.views.childDetails.bindEvents();
			} else {
				this.bindEvents();
			}
		},

		/* close the modal container */
		closeModal: function closeModal() {

			$( '.modal__background' ).fadeOut();
			$( '.modal__container' ).fadeOut( function() {
				// TODO: this removes a class from the modal to adjust it's size.  This should be handled in the modal view once it's created
				// wait until the modal has finished fading out before changing the modal size by removing this class
				$( this ).removeClass( 'modal__container--small' );
			});

			mare.utils.enablePageScrolling();
			/* TODO: this doesn't belong in modal, emit an event on close so the child details view can respond to it appropriatly */
			// This event is called from a click event so the view context is lost, we need to explicitly call all functions
			if( mare.views.childDetails ) {
				mare.views.childDetails.unbindEvents();
			} else {
				this.unbindEvents();
			}
		}
	});
}());
