( function () {
	'use strict';

	mare.views.EventAttendees = Backbone.View.extend({

		el: '.events__attendees',

		events: {
			'mouseenter .card__list-item--editable': 'showControls',
			'mouseleave .card__list-item--editable': 'hideControls',
			'click .card__list-item-delete-content': 'handleDeleteAttendeeClick',
			'click .card__list-item-edit-content': 'handleEditAttendeeClick',
			'click .card__list-item-undo-edit': 'handleUndoAttendeeChangesClick',
			'click .events__add-unregistered-attendee': 'handleAddUnregisteredAttendeeClick',
			'click .events__save-changes': 'saveChanges'
		},

		initialize: function initialize() {

			this.eventId = $( '.event' ).data( 'eventId' );

			// create a hook to access the template for rendering unregistered child/adult list items
			var unregisteredChildHtml = $( '#event-unregistered-child-template' ).html();
			var unregisteredAdultHtml = $( '#event-unregistered-adult-template' ).html();
			// compile the template to be used when adding a new unregistered child/adult list item
			this.unregisteredChildTemplate = Handlebars.compile( unregisteredChildHtml );
			this.unregisteredAdultTemplate = Handlebars.compile( unregisteredAdultHtml );	

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

			mare.views.eventAddUnregisteredChild.bind( 'childAdded', this.handleChildAdded.bind( this ) );
			mare.views.eventAddUnregisteredAdult.bind( 'adultAdded', this.handleAdultAdded.bind( this ) );

			// create an id value to be used and incremented when adding new children/adults
			this.nextId = 1;
		},

		renderNewAttendee: function renderNewAttendee( options ) {

			var html = '';

			if( options.type === 'child' ) {
				// pass the child model to through the unregistered child template we stored during initialization
				html = this.unregisteredChildTemplate( { child: options.attendee } );
				this.$( '.events__unregistered-child-attendees' ).append( html );

			} else if( options.type === 'adult' ) {
				// pass the child model to through the unregistered adult template we stored during initialization
				html = this.unregisteredAdultTemplate( { adult: options.attendee } );
				this.$( '.events__unregistered-adult-attendees' ).append( html );
			}
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
			$attendee.data( 'deleted', true );
			// mark the list item as deleted
			$attendee.addClass( 'card__list-item--deleted' );

			// disable the delete and edit controls for the list item
			$( event.currentTarget ).addClass( 'card__list-item-content-control--disabled' );
			$( event.currentTarget ).siblings( '.card__list-item-edit-content' ).addClass( 'card__list-item-content-control--disabled' );

			// enable the undo edits control for the list item
			$( event.currentTarget ).siblings( '.card__list-item-undo-edit' ).removeClass( 'card__list-item-content-control--disabled' );

			// check for changes, and display the save changes button if there are
			this.toggleSaveChangesButton();
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
				// only children will have an age and social worker set
				var attendeeAge = attendee.data( 'age' );
				var registrantId = attendee.data( 'registrantId' );
				// pass the child details in the the editChildAttendee function for handling
				var childDetails = {
					id: attendeeId,
					firstName: attendeeFirstName,
					lastName: attendeeLastName,
					age: attendeeAge,
					registrantId: registrantId
				};

				// pass the request for editing the child to the subview in charge of the details modal
				mare.views.eventAddUnregisteredChild.showEditModal( childDetails );

			} else if( attendeeType === 'adult' ) {

				var adultDetails = {
					id: attendeeId,
					firstName: attendeeFirstName,
					lastName: attendeeLastName
				}
				// pass the request for editing the adult to the subview in charge of the details modal
				mare.views.eventAddUnregisteredAdult.showEditModal( adultDetails );
			}
		},

		handleUndoAttendeeChangesClick: function handleUndoAttendeeChangesClick( event ) {

			// do nothing if undoing changes to the content item is diabled
			if( $( event.currentTarget ).hasClass( 'card__list-item-content-control--disabled' ) ) {
				return;
			}

			var $currentTarget = $( event.currentTarget );
			var $attendee = $currentTarget.closest( '.card__list-item' );

			var attendeeType = $attendee.data( 'attendeeType' );
			var originalFirstName = $attendee.data( 'originalFirstName' );
			var originalLastName = $attendee.data( 'originalLastName' );

			// reset the data attributes to their original values
			$attendee.data( 'firstName', originalFirstName );
			$attendee.data( 'lastName', originalLastName );

			// remove data attributes indicating the attendee has been edited or deleted
			$attendee.data( 'edited', false );
			$attendee.data( 'deleted', false );

			if( attendeeType === 'child' ) {
				var originalAge = $attendee.data( 'originalAge' );
				var originalRegistrantId = $attendee.data( 'originalRegistrantId' );

				$attendee.data( 'age', originalAge );
				$attendee.data( 'registrantId', originalRegistrantId );
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

			// check for changes, and display the save changes button if there are
			this.toggleSaveChangesButton();
		},

		handleAddUnregisteredAttendeeClick: function handleAddUnregisteredAttendeeClick() {
			// fetch the child/adult data
			var attendeeType = $( event.target ).siblings( '.events__unregistered-attendees' ).data( 'attendeeType' );

			if( attendeeType === 'child' ) {

				mare.views.eventAddUnregisteredChild.showAddModal( this.nextId );

			} else if( attendeeType === 'adult' ) {

				mare.views.eventAddUnregisteredAdult.showAddModal( this.nextId );
			}
		},

		handleChildEdited: function handleChildEdited( child ) {
			// get the DOM element for the child matching the returned id
			var $childNode = this.$('.events__unregistered-child-attendee[data-id='+ child.id + ']');

			// update the data attributes for the DOM element
			$childNode.data( 'firstName', child.firstName.trim() );
			$childNode.data( 'lastName', child.lastName.trim() );
			$childNode.data( 'registrantId', child.registrantId.trim() );
			$childNode.data( 'age', child.age.trim() );

			// if the child data matches the original values
			if( child.firstName === $childNode.data( 'originalFirstName' )
				&& child.lastName === $childNode.data( 'originalLastName' )
				&& child.registrantId === $childNode.data( 'originalRegistrantId' )
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

			// check for changes, and display the save changes button if there are
			this.toggleSaveChangesButton();
		},

		handleAdultEdited: function handleAdultEdited( adult ) {
			// get the DOM element for the adult matching the returned id
			var $adultNode = this.$('.events__unregistered-adult-attendee[data-id='+ adult.id + ']');

			// update the data attributes for the DOM element
			$adultNode.data( 'firstName', adult.firstName.trim() );
			$adultNode.data( 'lastName', adult.lastName.trim() );
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

			// check for changes, and display the save changes button if there are
			this.toggleSaveChangesButton();
		},

		handleChildAdded: function handleChildAdded( child ) {
			this.renderNewAttendee( { type: 'child', attendee: child } );

			this.nextId++;

			// check for changes, and display the save changes button if there are
			this.toggleSaveChangesButton();
		},

		handleAdultAdded: function handleAdultAdded( adult ) {
			this.renderNewAttendee( { type: 'adult', attendee: adult } );

			this.nextId++;

			// check for changes, and display the save changes button if there are
			this.toggleSaveChangesButton();
		},

		toggleSaveChangesButton: function toggleSaveChangesButton() {
			
			var addedChildren = this.getAddedChildren();
			var deletedChildren = this.getDeletedChildren();
			var editedChildren = this.getEditedChildren();
			var addedAdults = this.getAddedAdults();
			var deletedAdults = this.getDeletedAdults();
			var editedAdults = this.getEditedAdults();

			// if there are any added/deleted/edited children/adults, show the save changes button
			if( addedChildren.length > 0
				|| deletedChildren.length > 0
				|| editedChildren.length > 0
				|| addedAdults.length > 0
				|| deletedAdults.length > 0
				|| editedAdults.length > 0
			) {
				$( '.events__save-changes' ).removeClass( 'events__save-changes--hidden' );
			} else {
				$( '.events__save-changes' ).addClass( 'events__save-changes--hidden' );
			}
		},

		saveChanges: function saveChanges( event ) {

			var changes = {
				addedChildren: [],
				deletedChildren: [],
				editedChildren: [],
				addedAdults: [],
				deletedAdults: [],
				editedAdults: []
			};

			this.getAddedChildren()
				.map( function( index, child ) {
					// cache the jquery wrapped child element
					var $child = $( child );

					changes.addedChildren.push({
						firstName: $child.data( 'firstName' ),
						lastName: $child.data( 'lastName' ),
						age: $child.data( 'age' ),
						registrantId: $child.data( 'registrantId' )
					});
				});

			this.getDeletedChildren()
				.map( function( index, child ) {
					changes.deletedChildren.push( $( child ).data( 'id' ) );
				});

			this.getEditedChildren()
				.map( function( index, child ) {
					// cache the jquery wrapped child element
					var $child = $( child );

					changes.editedChildren.push({
						id: $child.data( 'id' ),
						firstName: $child.data( 'firstName' ),
						lastName: $child.data( 'lastName' ),
						age: $child.data( 'age' ),
						registrantId: $child.data( 'registrantId' )
					});
				});

			this.getAddedAdults()
				.map( function( index, adult ) {
					// cache the jquery wrapped adult element
					var $adult = $( adult );

					changes.addedAdults.push({
						firstName: $adult.data( 'firstName' ),
						lastName: $adult.data( 'lastName' )
					});
				});

			this.getDeletedAdults()
				.map( function( index, adult ) {
					changes.deletedAdults.push( $( adult ).data( 'id' ) );
				});

			this.getEditedAdults()
				.map( function( index, adult ) {
					// cache the jquery wrapped adult element
					var $adult = $( adult );

					changes.editedAdults.push({
						id: $adult.data( 'id' ),
						firstName: $adult.data( 'firstName' ),
						lastName: $adult.data( 'lastName' )
					});
				});

			$.ajax({
				type: 'PUT',
				url: '/events/' + this.eventId + '/attendees',
				data: changes
			// reload the current page regardless of the actions success.  This is needed to make the changes appear permanent and display the flash message
			}).always( function() {
				window.location.reload()

			});
		},

		getAddedChildren: function getAddedChildren() {
			var unregisteredChildAttendees = this.$el.find( '.events__unregistered-child-attendees' );
			
			// only consider children who have been added, but aren't marked for deletion
			return unregisteredChildAttendees
				.find( '.events__unregistered-child-attendee' )
				.filter( function ( index, child ) {
					return $( child ).data( 'added' ) === true
						&& $( child ).data( 'deleted' ) !== true
				});
		},

		getDeletedChildren: function getDeletedChildren() {
			var unregisteredChildAttendees = this.$el.find( '.events__unregistered-child-attendees' );

			// consider any child marked for deletion
			return unregisteredChildAttendees
				.find( '.events__unregistered-child-attendee' )
				.filter( function( index, child ) {
					return $( child ).data( 'deleted' ) === true;
				});
		},

		getEditedChildren: function getEditedChildren() {
			var unregisteredChildAttendees = this.$el.find( '.events__unregistered-child-attendees' );

			// only consider edited children who aren't newly created and haven't been marked for deletion
			return unregisteredChildAttendees
				.find( '.events__unregistered-child-attendee' )
				.filter( function( index, child ) {
					return $( child ).data( 'edited' ) === true
						&& $( child ).data( 'added' ) !== true
						&& $( child ).data( 'deleted' ) !== true
				});
		},

		getAddedAdults: function getAddedAdults() {
			var unregisteredAdultAttendees = this.$el.find( '.events__unregistered-adult-attendees' );

			// only consider adults who have been added, but aren't marked for deletion
			return unregisteredAdultAttendees
				.find( '.events__unregistered-adult-attendee' )
				.filter( function ( index, adult ) {
					return $( adult ).data( 'added' ) === true
						&& $( adult ).data( 'deleted' ) !== true
				});
		},

		getDeletedAdults: function getDeletedAdults() {
			var unregisteredAdultAttendees = this.$el.find( '.events__unregistered-adult-attendees' );

			// consider any adult marked for deletion
			return unregisteredAdultAttendees
				.find( '.events__unregistered-adult-attendee' )
				.filter( function( index, adult ) {
					return $( adult ).data( 'deleted' ) === true;
				});
		},

		getEditedAdults: function getEditedAdults() {
			var unregisteredAdultAttendees = this.$el.find( '.events__unregistered-adult-attendees' );

			// only consider edited adults who aren't newly created and haven't been marked for deletion
			return unregisteredAdultAttendees
				.find( '.events__unregistered-adult-attendee' )
				.filter( function( index, adult ) {
					return $( adult ).data( 'edited' ) === true
						&& $( adult ).data( 'added' ) !== true
						&& $( adult ).data( 'deleted' ) !== true
				});
		}
	});
}());
