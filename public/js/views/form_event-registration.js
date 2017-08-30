( function () {
	'use strict';
	mare.views.EventRegistrationForm = Backbone.View.extend({
		// this view controls the content of the modal window, create an element to insert into the modal
		tagName: 'section',
		// give the container for our view a class we can hook into
		className: 'event-registration-container',
		
		initialize: function initialize() {     
			// create a hook to access the event registration modal contents template
			var html = $( '#event-registration-form-template' ).html();
			// if the template doesn't exist, the user isn't a family or social worker
			if( html ) {
				// create a hook to access the templates
				var personDetailsHtml			= $( '#event-registration-form_person-details-template' ).html(),
					registeredChildDetailsHtml	= $( '#event-registration-form_registered-child-details-template' ).html();
				
				// compile the template to be used during rendering/repainting the event registration modal
				this.template = Handlebars.compile( html );
				// compile the person and registered child templates
				this.personDetailsTemplate = Handlebars.compile( personDetailsHtml );
				// registered child details only apply to the social worker form, and the template will be undefined for other user types
				if( registeredChildDetailsHtml ) {
					this.registeredChildDetailsTemplate = Handlebars.compile( registeredChildDetailsHtml );
				}
			}
		},
		
		// events need to be bound every time the modal is opened, so they can't be put in an event block
		bindEvents: function bindEvents() {
			// bind an event to allow closing of the modal
			$( '.modal__close' ).click( this.closeModal.bind( this ) );
			// bind events for functionality within the form
			this.$( '.add-registered-child' ).click( this.addRegisteredChild.bind( this ) );
			this.$( '.remove-registered-child' ).click( this.removeRegisteredChild.bind( this ) );
			this.$( '.number-of-adults-select' ).change( this.updateAdultsSection.bind( this ) );
			this.$( '.number-of-children-select' ).change( this.updateChildrenSection.bind( this ) );
		},
		
		// events need to be unbound every time the modal is closed
		unbindEvents: function unbindEvents() {
			$( '.modal__close' ).unbind( 'click' );
			this.$( '.add-registered-child' ).unbind( 'click' );
			this.$( '.remove-registered-child' ).unbind( 'click' );
			this.$( '.number-of-adults-select' ).unbind( 'change' );
			this.$( '.number-of-children-select' ).unbind( 'change' );
		},
		
		render: function render( event ) {
			// DOM cache the event parent and extract important information from it's data attributes
			var $event		= $( event.currentTarget ).closest( '.event' ),
				eventId		= $event.data( 'event-id' ),
				eventName	= $event.data( 'event-name' ),
				eventDate	= $event.data( 'event-date' );

			// pass the child model through the template we stored during initialization
			var html = this.template( { eventName: eventName, eventDate: eventDate, eventId: eventId } );
			this.$el.html( html );
			// render the contents area and tabs
			$( '.modal-container__contents' ).html( this.$el );
			// TODO: due to the child details for the gallery, the gallery by default shows a loading indicator instead of the contents
			// this fixes the display.  Once the modal becomes it's own view that accepts options, hacky fixes like this won't be necessary
			$( '.modal-container__loading' ).hide();
			$( '.modal-container__contents' ).show();
		},
		
		/* when the register button on an event card is clicked, display the event registration form */
		handleRegisterButtonClick: function handleRegisterButtonClick( event ) {
			// populate the modal with the event registration template
			this.render( event );
			// open the modal
			this.openModal();
		},
		
		addRegisteredChild: function addRegisteredChild( event ) {
			// NOTE: for some reason non-submit button presses were triggering a new page to load, this prevents that behavior
			event.preventDefault();
			// get the currently selected child from the dropdown menu
			var selectedChild       = this.$( '.mare-registered-children-select option:selected' ),
				selectedChildId     = selectedChild.val(),
				selectedChildName   = selectedChild.html();
			// generate the html for the new child using the child's details
			var childDetails = this.registeredChildDetailsTemplate({ childId: selectedChildId,
																	 childName: selectedChildName });
			// append the child html to the page
			this.$( '.registered-children-container' ).append( childDetails );
			// bind the last remove button on the page, which corresponds to the newly added child
			this.$( '.remove-registered-child:last' ).click( this.removeRegisteredChild.bind( this ) );
		},
		
		removeRegisteredChild: function removeRegisteredChild( event ) {
			// unbind the clicked remove button
			$( event.currentTarget ).unbind( 'click' );
			// remove the child section
			$( event.currentTarget ).closest( '.attending-registered-child' ).remove();
		},
		
		// TODO: use this functionality to update the children in home in registration-family.js
		updateAdultsSection: function updateAdultsSection( event ) {
			// count the number of adult data groups already shown on the page
			var currentAdults = this.$( '.attending-adult' ).length;
			// get the number of adults to show
			var adultsToShow = parseInt( event.currentTarget.value, 10 );
			if ( adultsToShow > currentAdults ) {
				// store options dictating how to build the needed person details sections
				var options = {
					type: 'adult',
					currentSections: currentAdults,
					sectionsToAdd: adultsToShow
				}
				// show the appropriate number of adult forms
				this.generatePersonDetailInputs( options );
			} else {
				// remove extra additional adult forms
				for( var i = currentAdults; i > adultsToShow; i-- ) {
					$( '.adult-' + i ).remove();
				}
			}
		},
		
		updateChildrenSection: function updateChildrenSection( event ) {
			// count the number of child data groups already shown on the page
			var currentChildren = this.$( '.attending-child' ).length;
			// get the number of children to show
			var childrenToShow = parseInt( event.currentTarget.value, 10 );
			if ( childrenToShow > currentChildren ) {
				// store options dictating how to build the needed person details sections
				var options = {
					type: 'child',
					currentSections: currentChildren,
					sectionsToAdd: childrenToShow
				}
				// show the appropriate number of child forms
				this.generatePersonDetailInputs( options );
			} else {
				// remove extra additional child forms
				for( var i = currentChildren; i > childrenToShow; i-- ) {
					$( '.child-' + i ).remove();
				}
			}
		},
		
		generatePersonDetailInputs: function generatePersonDetailInputs( options ) {
			// create a variable to build the template into
			var html = ''
			// add sections that aren't already on the page
			for( var i = options.currentSections + 1; i <= options.sectionsToAdd; i++ ) {
				// pass the relevant data through the event registration form person details template to add sections to the page
				html += this.personDetailsTemplate({ count      : i,
													 personType : options.type });
			}
			// if we're meant to append adults
			if( options.type === 'adult' ) {
				// append the newly generated markup to the adults section
				this.$( '.adults-attending-container' ).append( html );
			// otherwise, if we're meant to append children
			} else if (options.type === 'child' ) {
				// append the newly generated markup to the children section
				this.$( '.children-attending-container' ).append( html );
			}
		},
		
		/* TODO: all modal functions below mirror the calls made in waiting-child-profiles-child-details.js.  Both files need to use
				 a modal.js Backbone view which should handle all this.
		/* open the modal container */
		openModal: function openModal() {
			
			// TODO: this adds a class to the modal to adjust it's size.  This should be handled by passing in a size option to a modal view on initialization
			$( '.modal__container' ).addClass( 'modal__container--large' );
			$( '.modal__background' ).fadeIn();
			$( '.modal__container' ).fadeIn();
			
			mare.utils.disablePageScrolling();
			// bind click events for the newly rendered elements
			this.bindEvents();
		},
		
		/* close the modal container */
		closeModal: function closeModal() {
			$( '.modal__background' ).fadeOut();
			$( '.modal__container' ).fadeOut( function() {
				// TODO: this removes a class from the modal to adjust it's size.  This should be handled in the modal view once it's created
				// wait until the modal has finished fading out before changing the modal size by removing this class
				$( this ).removeClass( 'modal__container--large' );
			});
			
			mare.utils.enablePageScrolling();
			/* TODO: move this to a modal component and emit an event on close so the child details view can respond to it appropriatly */
			this.unbindEvents();
		},

		validateForm: function validateForm() {
			var ok = $( '.parsley-error' ).length === 0;
			$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
			$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
		}
	});
}());
