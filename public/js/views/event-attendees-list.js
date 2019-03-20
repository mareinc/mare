( function () {
	'use strict';

	mare.views.EventAttendees = Backbone.View.extend({

		el: '.events__attendees',

		events: {
			'mouseenter .card__list-item--editable': 'showControls',
			'mouseleave .card__list-item--editable': 'hideControls',
			'click .card__list-item-delete-content': 'handleDeleteAttendeeClick',
			'click .card__list-item-edit-content': 'handleEditAttendeeClick',
			'click .card__list-item-undo-edit': 'handleUndoAttendeeChangesClick'
		},

		initialize: function initialize() {
			// create a collection to hold the returned social worker information
			mare.collections.socialWorkers = mare.collections.socialWorkers || new mare.collections.SocialWorkers();
			// create a promis to resolve once we have data for all active social workers
			mare.promises.socialWorkerDataLoaded = $.Deferred();
			// fetch all active social workers
			this.getSocialWorkers();

			// initialize views for the add unregistered child and add unregistered adult modals
			mare.views.eventAddUnregisteredChild = mare.views.eventAddUnregisteredChild || new mare.views.EventAddUnregisteredChild();
			mare.views.eventAddUnregisteredAdult = mare.views.eventAddUnregisteredAdult || new mare.views.EventAddUnregisteredAdult();

			mare.views.eventAddUnregisteredChild.bind( 'childEdited', this.handleChildEdited.bind( this ) );
			mare.views.eventAddUnregisteredAdult.bind( 'adultEdited', this.handleAdultEdited.bind( this ) );
		},

		/* get all active social worker names and ids */
		getSocialWorkers: function getSocialWorkers() {
			$.ajax({
				type: 'POST',
				url: '/events/get/social-worker-data',
				dataType: 'json'
			}).done( function( socialWorkers ) {
				// store all social workers in a collection for easy access
				mare.collections.socialWorkers.add( socialWorkers );
				// resolve the promise tracking social worker data loading
				mare.promises.socialWorkerDataLoaded.resolve();

			}).fail( function( err ) {
				// TODO: show an error message if we failed to fetch the social worker data
				console.log( err );
			});
		},

		showControls: function showControls( event ) {
			$( event.currentTarget ).find( '.card__list-item-content-control' ).removeClass( 'card__list-item-content-control--hidden' );
		},

		hideControls: function hideControls( event ) {
			$( event.currentTarget ).find( '.card__list-item-content-control' ).addClass( 'card__list-item-content-control--hidden' );
		},

		handleDeleteAttendeeClick: function handleDeleteAttendeeClick( event ) {
			// do nothing if deleting the content item is diabled
			if( $( event.currentTarget ).hasClass( 'card__list-item-content-control--disabled' ) ) {
				return;
			}

			var $attendee = $( event.currentTarget ).closest( '.card__list-item' )

			// add a data attribute indicating the attendee has been deleted
			$attendee.data( 'edited', false );
			// mark the list item as deleted
			$attendee.addClass( 'card__list-item--deleted' );

			// disable the delete and edit controls for the list item
			$( event.currentTarget ).addClass( 'card__list-item-content-control--disabled' );
			$( event.currentTarget ).siblings( '.card__list-item-edit-content' ).addClass( 'card__list-item-content-control--disabled' );

			// enable the undo edits control for the list item
			$( event.currentTarget ).siblings( '.card__list-item-undo-edit' ).removeClass( 'card__list-item-content-control--disabled' );
		},

		handleEditAttendeeClick: function handleEditAttendeeClick( event ) {
			// do nothing if editing the content item is diabled
			if( $( event.currentTarget ).hasClass( 'card__list-item-content-control--disabled' ) ) {
				return;
			}

			// fetch the child/adult data
			var attendee = $( event.currentTarget ).closest( '.card__list-item' );
			var attendeeId = attendee.data( 'id' );
			var attendeeType = attendee.data( 'attendeeType' );
			var attendeeFirstName = attendee.data( 'firstName' );
			var attendeeLastName = attendee.data( 'lastName' );

			if( attendeeType === 'child' ) {
				// only children will have an age set
				var attendeeAge = attendee.data( 'age' );
				// pass the child details in the the editChildAttendee function for handling
				this.editChildAttendee({
					id: attendeeId,
					firstName: attendeeFirstName,
					lastName: attendeeLastName,
					age: attendeeAge
				});

			} else if( attendeeType === 'adult' ) {
				// pass the child details in the the editAdultAttendee function for handling
				this.editAdultAttendee({
					id: attendeeId,
					firstName: attendeeFirstName,
					lastName: attendeeLastName
				})
			}

			// create the form to edit content
			// 	first/last name, and for children an age and social worker field
			//	QUESTION: should adults be able to be tied to a family?
			// populate the modal with the current information
			// populate the modal social worker selection field with the current social worker
			// show the modal
			// the modal should be able to handle a save or undo button click that will send an event back here

			// TODO: before to trim before saving
		},

		handleUndoAttendeeChangesClick: function handleUndoAttendeeChangesClick( event ) {

			// do nothing if undoing changes to the content item is diabled
			if( $( event.currentTarget ).hasClass( 'card__list-item-content-control--disabled' ) ) {
				return;
			}

			var $currentTarget = $( event.currentTarget );
			var $attendee = $currentTarget.closest( '.card__list-item' );

			var attendeeType = $attendee.data( 'attendee-type' );
			var originalFirstName = $attendee.data( 'original-first-name' );
			var originalLastName = $attendee.data( 'original-last-name' );

			// reset the data attributes to their original values
			$attendee.data( 'first-name', originalFirstName );
			$attendee.data( 'last-name', originalLastName );

			// remove data attributes indicating the attendee has been edited or deleted
			$attendee.data( 'edited', false );
			$attendee.data( 'deleted', false );

			if( attendeeType === 'child' ) {
				var originalAge = $attendee.data( 'original-age' );

				$attendee.data( 'age', originalAge );
			}

			// reset the visible name field
			$currentTarget.siblings( '.events__attendee-name' ).html( originalFirstName + ' ' + originalLastName );

			// remove any classes marking the list item as deleted or edited
			$( event.currentTarget )
				.closest( '.card__list-item' )
				.removeClass( 'card__list-item--deleted' )
				.removeClass( 'card__list-item--edited' );

			// disable the undo button
			$( event.currentTarget ).addClass( 'card__list-item-content-control--disabled' );

			// enable the delete and edit controls for the list item
			$( event.currentTarget ).siblings( '.card__list-item-edit-content' ).removeClass( 'card__list-item-content-control--disabled' );
			$( event.currentTarget ).siblings( '.card__list-item-delete-content' ).removeClass( 'card__list-item-content-control--disabled' );
		},

		editChildAttendee: function editChildAttendee( child ) {
			/* pass the request for editing the child to the subview in charge of the details modal */
			mare.views.eventAddUnregisteredChild.showEditModal( child );
		},

		editAdultAttendee: function editAdultAttendee( adult ) {
			/* pass the request for editing the child to the subview in charge of the details modal */
			mare.views.eventAddUnregisteredAdult.showEditModal( adult );
		},

		handleChildEdited: function handleChildEdited( child ) {
			// get the DOM element for the child matching the returned id
			var $childNode = this.$('.events__unregistered-child-attendee[data-id*='+ child.id + ']');

			// update the data attributes for the DOM element
			$childNode.data( 'firstName', child.firstName );
			$childNode.data( 'lastName', child.lastName );
			$childNode.data( 'age', child.age );

			// if the child data matches the original values
			if( child.firstName === $childNode.data( 'originalFirstName' )
				&& child.lastName === $childNode.data( 'originalLastName' )
				&& child.age === $childNode.data( 'originalAge' ).toString() ) {
				// remove the edited class from the DOM element
				$childNode.removeClass( 'card__list-item--edited' )
				// remove the edited data attribute from the DOM element
				$childNode.data( 'edited', false );

				// disable the undo edits control for the list item
				$childNode.find( '.card__list-item-undo-edit' ).addClass( 'card__list-item-content-control--disabled' );
			// if the child data is different from the original values
			} else {
				// add the edited class to the DOM element
				$childNode.addClass( 'card__list-item--edited' );
				// add the edited data attribute to the DOM element
				$childNode.data( 'edited', true );

				// enable the undo edits control for the list item
				$childNode.find( '.card__list-item-undo-edit' ).removeClass( 'card__list-item-content-control--disabled' );
			}

			// update the HTML of the DOM element
			$childNode.find( '.events__attendee-name' ).html( child.firstName + ' ' + child.lastName );
		},

		handleAdultEdited: function handleAdultEdited( adult ) {
			// get the DOM element for the adult matching the returned id
			var $adultNode = this.$('.events__unregistered-adult-attendee[data-id*='+ adult.id + ']');

			// update the data attributes for the DOM element
			$adultNode.data( 'firstName', adult.firstName );
			$adultNode.data( 'lastName', adult.lastName );
			$adultNode.data( 'edited', true );

			// if the child data matches the original values
			if( adult.firstName === $adultNode.data( 'originalFirstName' )
				&& adult.lastName === $adultNode.data( 'originalLastName' ) ) {
				// remove the edited class from the DOM element
				$adultNode.removeClass( 'card__list-item--edited' )
				// remove the edited data attribute from the DOM element
				$adultNode.data( 'edited', false );

				// disable the undo edits control for the list item
				$adultNode.find( '.card__list-item-undo-edit' ).addClass( 'card__list-item-content-control--disabled' );
			// if the adult data is different from the original values
			} else {
				// add the edited class to the DOM element
				$adultNode.addClass( 'card__list-item--edited' );
				// add the edited data attribute to the DOM element
				$adultNode.data( 'edited', true );

				// enable the undo edits control for the list item
				$adultNode.find( '.card__list-item-undo-edit' ).removeClass( 'card__list-item-content-control--disabled' );
			}

			// update the HTML of the DOM element
			$adultNode.find( '.events__attendee-name' ).html( adult.firstName + ' ' + adult.lastName );
		},
	});
}());
