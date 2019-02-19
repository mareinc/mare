( function () {
	'use strict';
	mare.views.EventRegistrationForm = Backbone.View.extend({
		// this view controls the content of the modal window, create an element to insert into the modal
		tagName: 'section',
		// give the container for our view a class we can hook into
		className: 'event-registration-container',

		events: {
			'change .source-select': 'checkOtherSourceField'
		},

		initialize: function initialize() {
			// create a hook to access the event registration modal contents templates
			var registrationFormHTML = $( '#event-registration-form-template' ).html();
			var editRegistrationFormHTML = $( '#event-edit-registration-form-template' ).html();
			// if the registration template exists, the user is logged in
			if( registrationFormHTML ) {
				// create a hook to access the templates
				var personDetailsHtml			= $( '#event-registration-form_person-details-template' ).html(),
					registeredChildDetailsHtml	= $( '#event-registration-form_registered-child-details-template' ).html();

				// compile the template to be used during rendering/repainting the event registration/edit registration modal
				this.registrationFormTemplate = Handlebars.compile( registrationFormHTML );
				this.editRegistrationFormTemplate = Handlebars.compile( editRegistrationFormHTML );
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
			this.$( '.registered-children-select' ).change( this.selectRegisteredChild.bind( this ) );
			this.$( '.remove-registered-child' ).click( this.removeRegisteredChild.bind( this ) );
			this.$( '.number-of-adults-select' ).change( this.selectNumberOfAdults.bind( this ) );
			this.$( '.number-of-children-select' ).change( this.selectNumberOfChildren.bind( this ) );
		},

		// events need to be unbound every time the modal is closed
		unbindEvents: function unbindEvents() {
			$( '.modal__close' ).unbind( 'click' );
			this.$( '.registered-children-select' ).unbind( 'change' );
			this.$( '.remove-registered-child' ).unbind( 'click' );
			this.$( '.number-of-adults-select' ).unbind( 'change' );
			this.$( '.number-of-children-select' ).unbind( 'change' );
		},

		render: function render( event, action ) {
			// DOM cache the event parent and extract important information from it's data attributes
			var $event = $( event.currentTarget ).closest( '.event' ),
				eventId = $event.data( 'event-id' ),
				eventName = $event.data( 'event-name' ),
				eventDate = $event.data( 'event-date' ),
				html;

			// pass the child model through the template we stored during initialization
			if( action === 'register' ) {
				html = this.registrationFormTemplate({
					eventName: eventName,
					eventDate: eventDate,
					eventId: eventId
				});
			} else if( action === 'edit' ) {
				html = this.editRegistrationFormTemplate({
					eventName: eventName,
					eventDate: eventDate,
					eventId: eventId
				});
			}
			this.$el.html( html );
			// render the contents area and tabs
			$( '.modal-container__contents' ).html( this.$el );
			// TODO: due to the child details for the gallery, the gallery by default shows a loading indicator instead of the contents
			// this fixes the display.  Once the modal becomes it's own view that accepts options, hacky fixes like this won't be necessary
			$( '.modal-container__loading' ).hide();
			$( '.modal-container__contents' ).show();
		},

		/* when the register button on an event card is clicked, display the event registration form */
		handleRegisterButtonClick: function handleRegisterButtonClick( event, action ) {
			// populate the modal with the event registration template, modifying it based on an action of 'register' or 'edit'
			this.render( event, action );


			if( action === 'edit' ) {
				// DOM cache the event parent and extract important information from it's data attributes
				var $event = $( event.currentTarget ).closest( '.event' ),
					registeredChildrenUserIsBringing = $event.data( 'registered-children-user-is-bringing' ) || [],
					unregisteredChildrenUserIsBringing = $event.data( 'unregistered-children-user-is-bringing' ) || [],
					unregisteredAdultsUserIsBringing = $event.data( 'unregistered-adults-user-is-bringing' ) || [],
					numberOfUnregisteredChildrenUserIsBringing = unregisteredChildrenUserIsBringing.length,
					numberOfUnregisteredAdultsUserIsBringing = unregisteredAdultsUserIsBringing.length;
			
					registeredChildrenUserIsBringing.forEach( function( child ) {
						this.addRegisteredChild( child.name, child.id );
					}.bind( this ) );

					this.$('.number-of-children-select>option:eq(' + numberOfUnregisteredChildrenUserIsBringing + ')' ).prop( 'selected', true );
					this.$('.number-of-adults-select>option:eq(' + numberOfUnregisteredAdultsUserIsBringing + ')' ).prop( 'selected', true );

					this.updateChildrenSection( numberOfUnregisteredChildrenUserIsBringing );
					this.updateAdultsSection( numberOfUnregisteredAdultsUserIsBringing );

					unregisteredChildrenUserIsBringing.forEach( function( child, index ) {
						this.$( '#child-first-name-' + ( index + 1 ) ).val( child.name.first );
						this.$( '#child-last-name-' + ( index + 1 ) ).val( child.name.last );
						this.$( '#child-age-' + ( index + 1 ) ).val( child.age );
					}.bind( this ) );
					
					unregisteredAdultsUserIsBringing.forEach( function( adult, index ) {
						this.$( '#adult-first-name-' + ( index + 1 ) ).val( adult.name.first );
						this.$( '#adult-last-name-' + ( index + 1 ) ).val( adult.name.last );
					}.bind( this ) );
			}

			// open the modal
			this.openModal();
		},

		selectRegisteredChild: function selectRegisteredChild( event ) {
			// NOTE: for some reason non-submit button presses were triggering a new page to load, this prevents that behavior
			event.preventDefault();
			// get the currently selected child from the dropdown menu
			var selectedChild       = this.$( '.registered-children-select option:selected' ),
				selectedChildName   = selectedChild.html(),
				selectedChildId     = selectedChild.val();

			this.addRegisteredChild( selectedChildName, selectedChildId )
		},

		addRegisteredChild: function addRegisteredChild( name, id ) {
			// check if the newly selected child has already been selected
			var hasChildAlreadyBeenSelected = false;
			this.$( '.registered-children-container input.hidden' ).each( function() {
				if ( id === $( this ).val() ) {
					hasChildAlreadyBeenSelected = true;
				}
			});

			// if the child hasn't already been selected, add it to the list
			if ( !hasChildAlreadyBeenSelected && id.length > 0 ) {
				// generate the html for the new child using the child's details
				var childDetails = this.registeredChildDetailsTemplate({ childId: id,
					childName: name });
				// append the child html to the page
				this.$( '.registered-children-container' ).append( childDetails );
				// bind the last remove button on the page, which corresponds to the newly added child
				this.$( '.remove-registered-child:last' ).click( this.removeRegisteredChild.bind( this ) );
				// hide/show fields based on number of children attending
				this.checkNumberOfChildrenAttending();
			}
			
			this.$( '.registered-children-select' ).val( '' );
		},

		removeRegisteredChild: function removeRegisteredChild( event ) {
			// unbind the clicked remove button
			$( event.currentTarget ).unbind( 'click' );
			// remove the child section
			$( event.currentTarget ).closest( '.attending-registered-child' ).remove();
			// hide/show fields based on number of children attending
			this.checkNumberOfChildrenAttending();
		},

		selectNumberOfAdults: function selectNumberOfAdults( event ) {
			// get the number of adults to show
			var adultsToShow = parseInt( event.currentTarget.value, 10 );
			// update the number of adult inputs displayed
			this.updateAdultsSection( adultsToShow );
		},

		// TODO: use this functionality to update the children in home in registration-family.js
		updateAdultsSection: function updateAdultsSection( adultsToShow ) {
			// count the number of adult data groups already shown on the page
			var currentAdults = this.$( '.attending-adult' ).length;
			
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

		selectNumberOfChildren: function selectNumberOfChildren( event ) {
			// get the number of children to show
			var childrenToShow = parseInt( event.currentTarget.value, 10 );
			// update the number of child inputs displayed
			this.updateChildrenSection( childrenToShow );
		},

		updateChildrenSection: function updateChildrenSection( childrenToShow ) {
			// count the number of child data groups already shown on the page
			var currentChildren = this.$( '.attending-child' ).length;

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
			// hide/show fields based on number of children attending
			this.checkNumberOfChildrenAttending();
		},

		generatePersonDetailInputs: function generatePersonDetailInputs( options ) {
			// create a variable to build the template into
			var html = ''
			// add sections that aren't already on the page
			for( var i = options.currentSections + 1; i <= options.sectionsToAdd; i++ ) {
				// pass the relevant data through the event registration form person details template to add sections to the page
				html += this.personDetailsTemplate({
					count: i,
					personType: options.type
				});
			}
			// if we're meant to append adults
			if( options.type === 'adult' ) {
				// append the newly generated markup to the adults section
				this.$( '.adults-container' ).append( html );
			// otherwise, if we're meant to append children
			} else if (options.type === 'child' ) {
				// append the newly generated markup to the children section
				this.$( '.unregistered-children-container' ).append( html );
			}
		},

		checkOtherSourceField: function checkOtherSourceField( event ) {
			// if other is selected
			if( event.currentTarget.value === 'other' ) {
				// show the 'other source' field and its label
				$( '.other-source' ).attr( 'required', true );
				$( '.other-source' ).removeClass( 'hidden' );
				$( '.other-source-label' ).removeClass( 'hidden' );
			// otherwise
			} else {
				// hide the 'other source' field and its label
				$( '.other-source' ).attr( 'required', false );
				$( '.other-source' ).addClass( 'hidden' );
				$( '.other-source-label' ).addClass( 'hidden' );
			}
			// if the 'other source' field is hidden
			if( $( '.other-source' ).hasClass( 'hidden' ) ) {
				// clear out the input box since it's not part of the form submission
				$( '.other-source' ).val( '' );
			}
		},

		checkNumberOfChildrenAttending: function checkNumberOfChildrenAttending() {

			var registeredChildrenCount = this.$( '.registered-children-container' ).children().length;
			var unregisteredChildrenCount = this.$( '.attending-child' ).length;

			if ( registeredChildrenCount + unregisteredChildrenCount > 0 ) {
				$( '.attendance-capacity__container' ).hide();
				$( '#attendance-capacity' ).attr( 'required', false );
			} else {
				$( '.attendance-capacity__container' ).show();
				$( '#attendance-capacity' ).attr( 'required', true );
			}
		},

		/* TODO: all modal functions below mirror the calls made in waiting-child-profiles-child-details.js.  Both files need to use
				 a modal.js Backbone view which should handle all this.
		/* open the modal container */
		openModal: function openModal() {

			$( '.modal__background' ).fadeIn();
			$( '.modal__container' ).fadeIn();

			mare.utils.disablePageScrolling();
			// bind click events for the newly rendered elements
			this.bindEvents();
			this.initializeValidation();
		},

		/* close the modal container */
		closeModal: function closeModal() {

			$( '.modal__background' ).fadeOut();
			$( '.modal__container' ).fadeOut();

			mare.utils.enablePageScrolling();
			/* TODO: move this to a modal component and emit an event on close so the child details view can respond to it appropriatly */
			this.unbindEvents();
			// destory the validator
			this.form.destroy();
		},

		initializeValidation: function initializeValidation() {
			// initialize parsley validation on the form
			this.form = this.$( '.modal-form--register-for-event' ).parsley();
			this.form.on( 'field:validated', this.validateForm );
		},

		validateForm: function validateForm() {

			var ok = $( '.parsley-error' ).length === 0;
			$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
			$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
		}
	});
}());
