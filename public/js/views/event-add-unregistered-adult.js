(function () {
	'use strict';

	mare.views.EventAddUnregisteredAdult = Backbone.View.extend({
		// this view controls the content of the modal window, create an element to insert into the modal
		tagName: 'section',
		// give the container for our view a class we can hook into
  		className: 'adult-details',
		// bind standard events to functions within the view
		events: {
		},

		/* initialize the add unregistered adult modal */
		initialize: function initialize() {
			// create a hook to access the gallery template
			var html = $( '#event-add-unregistered-adult-template' ).html();
			// compile the template to be used during rendering/repainting the gallery
			this.template = Handlebars.compile( html );	
			// initialize the modal once we've fetched the social worker data needed to display the social worker dropdown
			mare.promises.socialWorkerDataLoaded.done( function() {
				this.socialWorkers = mare.collections.socialWorkers;
			}.bind( this ) );
		},

		// events need to be bound every time the modal is opened, so they can't be put in an event block
		bindEvents: function bindEvents() {
			$( '.modal__close' ).click( this.closeModal.bind( this ) );
			// bind events for button clicks
			this.$( '.events__edit-adult' ).click( this.saveEditedAdult.bind( this ) );
			this.$( '.events__add-adult' ).click( this.saveNewAdult.bind( this ) );
			this.$( '.events__cancel-add-adult' ).click( this.closeModal.bind( this ) );
		},

		// events need to be unbound every time the modal is closed
		unbindEvents: function unbindEvents() {
			$( '.modal__close' ).unbind( 'click' );
		},

		/* render the view onto the page */
		render: function render( options ) {
			// store a reference to the view for inside callbacks where context is lost
			var view = this;

			// pass the adult model to through the template we stored during initialization
			var html = this.template( { adult: options.adult, action: options.action } );
			this.$el.html( html );
			// render the contents area and tabs
			$( '.modal-container__contents' ).html( this.$el );
			// remove the loading indicator and display the details content
			$( '.modal-container__loading' ).hide();
			$( '.modal-container__contents' ).show();
		},

		/* open the edit adult modal with the adult's details */
		showEditModal: function edit( adult ) {
			// render the adult's details into the modal
			this.render( { adult: adult, action: 'edit' } );
			// display the modal
			this.openModal();
			// bind click events for the newly rendered elements
			this.bindEvents();
		},

		/* open the add new adult modal */
		showAddModal: function edit( adult ) {
			// render the adult's details into the modal
			this.render( { action: 'add' } );
			// display the modal
			this.openModal();
			// bind click events for the newly rendered elements
			this.bindEvents();
		},

		saveEditedAdult: function saveEditedAdult() {
			// send an event notifying the parent view that a adult has been edited
			this.trigger( 'adultEdited', {
				id: this.$( '#id' ).val(),
				firstName: this.$( '#firstName' ).val(),
				lastName: this.$( '#lastName' ).val(),
				age: this.$( '#age' ).val()
			});

			this.closeModal();
		},

		saveNewAdult: function saveNewAdult() {
			// send an event notifying the parent view that a adult has been added
			this.trigger( 'adultAdded', {
				firstName: this.$( '#firstName' ).val(),
				lastName: this.$( '#lastName' ).val(),
				age: this.$( '#age' ).val()
			});
		},

		/* open the modal container */
		openModal: function openModal() {
			// TODO: this adds a class to the modal to adjust it's size.  This should be handled by passing in a size option to a modal view on initialization
			$( '.modal__container' ).addClass( 'modal__container--small' );

			$( '.modal__background' ).fadeIn();
			$( '.modal__container' ).fadeIn();

			mare.utils.disablePageScrolling();
		},

		/* close the modal container */
		closeModal: function closeModal() {

			$( '.modal__background' ).fadeOut();
			$( '.modal__container' ).fadeOut();

			mare.utils.enablePageScrolling();

			this.clearModalContents();

			this.unbindEvents();
		},

		/* clear out the current contents of the modal */
		clearModalContents: function clearModalContents() {
			$( '.modal-container__contents' ).html( '' );
		},
	});
}());
