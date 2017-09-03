// TODO: rework bookmarking to separate out the event broadcasting and the reaction to the events.  With bookmark capability
//		 in the details section as well, this got a little ugly and can be cleaned up and simplified
//		 1: send the event that an update is needed
//		 2: make the ajax call to update and send an event on success or failure
//		 3: respond to the event by updating the classes
(function () {
	'use strict';

	mare.views.Gallery = Backbone.View.extend({
		// this view controls everything inside the element with class 'gallery'
		el: '.gallery',
		// bind standard events to functions within the view
		events: {
			'click .child-media-box'						: 'displayChildDetails',
			'click .sibling-group-media-box'				: 'displaySiblingGroupDetails',
			'click .child-bookmark'							: 'toggleChildBookmark',
			'click .sibling-group-bookmark'					: 'toggleSiblingGroupBookmark',
			'change .waiting-child-profiles__gallery-filter': 'sortGallery'
		},

		/* initialize the gallery view */
		initialize: function initialize() {
			// store a reference to this for insde callbacks where context is lost
			var view							= this;
			// create a hook to access the gallery template
			var galleryChildrenHtml				= $( '#gallery-children-template' ).html();
			var gallerySiblingGroupsHtml		= $( '#gallery-sibling-groups-template' ).html();
			// compile the templates to be used during rendering/repainting the gallery
			this.childrenTemplate				= Handlebars.compile( galleryChildrenHtml );
			this.siblingGroupsTemplate			= Handlebars.compile( gallerySiblingGroupsHtml )
			// initialize a subview for the details modals
			mare.views.childDetails				= mare.views.childDetails || new mare.views.ChildDetails();
			mare.views.siblingGroupDetails		= mare.views.siblingGroupDetails || new mare.views.SiblingGroupDetails();
			// initialize the gallery once we've fetched the child data needed to display the gallery (this doesn't include child details data)
			mare.promises.childrenDataLoaded.done( function() {
				view.childrenCollection			= mare.collections.galleryChildren;
				view.siblingGroupsCollection	= mare.collections.gallerySiblingGroups;
			});

			// bind to change events
			mare.collections.galleryChildren.on( 'sorted', function() {
				view.render();
			});
			// when we get a response from the server that the bookmark for a child has successfully updated, update the view
			mare.collections.galleryChildren.on( 'childBookmarkUpdated', function( registrationNumber, action ) {
				view.updateChildBookmarkView( registrationNumber, action );
			});
			// when we get a response from the server that the bookmark for a group of siblings successfully updated, update the view
			mare.collections.galleryChildren.on( 'siblingGroupBookmarkUpdated', function( registrationNumbers, action ) {
				view.updateSiblingGroupBookmarkView( registrationNumbers, action );
			});
			// when the details view sends an event to trigger updating the child bookmark, send the request to the server
			mare.collections.galleryChildren.on( 'childBookmarkUpdateNeeded', function( registrationNumber, action ) {
				if( action === 'add' ) {
					view.addChildBookmark( registrationNumber );
				} else if( action === 'remove' ) {
					view.removeChildBookmark( registrationNumber );
				}
			});
			// when the details view sends an event to trigger updating the sibling group bookmark, send the request to the server
			mare.collections.galleryChildren.on( 'siblingGroupBookmarkUpdateNeeded', function( registrationNumbers, action ) {
				if( action === 'add' ) {
					view.addSiblingGroupBookmark( registrationNumbers );
				} else if( action === 'remove' ) {
					view.removeSiblingGroupBookmark( registrationNumbers );
				}
			});
		},

		/* render the view onto the page */
		render: function render() {
			// store a reference to this for insde callbacks where context is lost
			var view = this;
			// the gallery can't render until we have the user permissions and the child data is loaded
			// use the promise bound to both data to delay rendering until we have them
			$.when( mare.promises.permissionsLoaded, mare.promises.childrenDataLoaded ).then( function() {
				// pass the collection data through the gallery template to generate the HTML to be added to the gallery
				var siblingGroupsHtml	= view.siblingGroupsTemplate( view.siblingGroupsCollection.toJSON() );
				var childrenHtml		= view.childrenTemplate( view.childrenCollection.toJSON() );

				view.$( '.profiles-container' ).html( siblingGroupsHtml + childrenHtml );
				// once the html is rendered to the page, initialize the gallery display plugin
				view.initializeMediaBoxes();
			});
		},

		/* ititializes the media box plugin that drives the images in the gallery */
		initializeMediaBoxes: function initializeMediaBoxes() {
			// initialize the photo listing children gallery grid
			$( '#children-grid' ).mediaBoxes({
				boxesToLoadStart: 12,
				boxesToLoad 	: 8
			});
			// initialize the photo listing sibling group gallery grid
			$( '#sibling-groups-grid' ).mediaBoxes({
				boxesToLoadStart: 12,
				boxesToLoad 	: 8
			});
		},

		/* pass the request for child details to the subview in charge of the details modal */
		displayChildDetails: function displayChildDetails( event ) {

			mare.views.childDetails.handleGalleryClick( event );
		},

		/* pass the request for sibling group detials to the subview in charge of the details modal */
		displaySiblingGroupDetails: function displaySiblingGroupDetails( event ) {

			mare.views.siblingGroupDetails.handleGalleryClick( event );
		},

		/* determine how to handle a click on the bookmark element */
		toggleChildBookmark: function toggleChildBookmark( event ) {
			// TODO: see if this is needed
			event.stopPropagation();
			// DOM cache the current target for performance
			var $currentTarget = $( event.currentTarget );
			// get the child's registration number to match them in the database
			var registrationNumber = $currentTarget.closest( '.media-box' ).data( 'registration-number' );

			// if we are currently saving the users attempt to toggle the bookmark and the server hasn't processed the change yet, ignore the click event
			if( $currentTarget.hasClass( 'bookmark--disabled' ) ) {

				return;

			// if the child is currently bookmarked, remove them
			} else if( $currentTarget.hasClass( 'bookmark--active' ) ) {

				$currentTarget.addClass( 'bookmark--disabled' );
				this.removeChildBookmark( registrationNumber );

			// if the child is not currently bookmarked, add them
			} else {

				$currentTarget.addClass( 'bookmark--disabled' );
				this.addChildBookmark( registrationNumber );

			}
		},

		/* determine how to handle a click on the bookmark element */
		toggleSiblingGroupBookmark: function toggleSiblingGroupBookmark( event ) {

			event.stopPropagation();
			// DOM cache the current target for performance
			var $currentTarget = $( event.currentTarget );
			// get the child's registration number to match them in the database
			var registrationNumbers = $currentTarget.closest( '.media-box' ).data( 'registration-numbers' );

			// if we are currently saving the users attempt to toggle the bookmark and the server hasn't processed the change yet, ignore the click event
			if( $currentTarget.hasClass( 'bookmark--disabled' ) ) {

				return;

			// if the child is currently bookmarked, remove them
			} else if( $currentTarget.hasClass( 'bookmark--active' ) ) {

				$currentTarget.addClass( 'bookmark--disabled' );
				this.removeSiblingGroupBookmark( registrationNumbers );

			// if the child is not currently bookmarked, add them
			} else {

				$currentTarget.addClass( 'bookmark--disabled' );
				this.addSiblingGroupBookmark( registrationNumbers );

			}
		},
		// TODO: combine the add / remove calls here and for siblings
		/* make a call to the server to bookmark the child */
		addChildBookmark: function addChildBookmark( registrationNumber ) {

			$.ajax({
				url: '/services/add-child-bookmark',
				type: 'POST',
				data: {
					registrationNumber: registrationNumber
				}
			}).done( function( response ) {
				// update the isBookmarked field for the target child model
				mare.collections.galleryChildren.each( function( child ) {
					if( child.get( 'registrationNumber' ) === registrationNumber ) {
						child.set( 'isBookmarked', true );
					}
				});
				// emit an event on the collection showing that the child's bookmark has been updated
				// this is bound to the collection so other views bound to the same data ( the details modal ) can respond
				mare.collections.galleryChildren.trigger( 'childBookmarkUpdated', registrationNumber, 'add' );

			}).fail( function( err ) {
				// TODO: Show an error message to the user
				console.log( err );
			});

		},

		/* make a call to the server to remove the bookmark for the child, then modify the view */
		removeChildBookmark: function removeChildBookmark( registrationNumber ) {

			$.ajax({
				url: '/services/remove-child-bookmark',
				type: 'POST',
				data: {
					registrationNumber: registrationNumber
				}
			}).done( function( response ) {
				// update the isBookmarked field for the target child model
				mare.collections.galleryChildren.each( function( child ) {
					if( child.get( 'registrationNumber' ) === registrationNumber ) {
						child.set( 'isBookmarked', false );
					}
				});
				// TODO: the following event and all like it should trigger off the isBookmarked attribute changing
				// emit an event on the collection showing that the child's bookmark has been updated
				// this is bound to the collection so other views bound to the same data ( the details modal ) can respond
				mare.collections.galleryChildren.trigger( 'childBookmarkUpdated', registrationNumber, 'remove' );

			}).fail( function( err ) {
				// TODO: Show an error message to the user
				console.log( err );
			});

		},

		/* make a call to the server to add bookmarks for all children in the sibling group, then modify the view */
		addSiblingGroupBookmark: function addSiblingGroupBookmark( registrationNumbers ) {

			$.ajax({
				url: '/services/add-sibling-group-bookmark',
				type: 'POST',
				data: {
					registrationNumbers: registrationNumbers
				}
			}).done( function( response ) {
				// create an array from the string of registration numbers in the sibling group
				var registrationNumbersArray = registrationNumbers.split( ',' );
				// update the isBookmarked field for the target siblingGroup model
				mare.collections.gallerySiblingGroups.each( function( siblingGroup ) {
					if( _.intersection( registrationNumbersArray, siblingGroup.get( 'registrationNumbers' ).length > 0 ) ) {
						siblingGroup.set( 'isBookmarked', true );
					}
				});
				// emit an event on the collection showing that the sibling group's bookmark has been updated
				// this is bound to the collection so other views bound to the same data ( the details modal ) can respond
				mare.collections.galleryChildren.trigger( 'siblingGroupBookmarkUpdated', registrationNumbers, 'add' );

			}).fail( function( err ) {
				// TODO: Show an error message to the user
				console.log( err );
			});
		},

		/* make a call to the server to remove bookmarks for all children in the sibling group, then modify the view */
		removeSiblingGroupBookmark: function removeSiblingGroupBookmark( registrationNumbers ) {

			$.ajax({
				url: '/services/remove-sibling-group-bookmark',
				type: 'POST',
				data: {
					registrationNumbers: registrationNumbers
				}
			}).done( function( response ) {
				// create an array from the string of registration numbers in the sibling group
				var registrationNumbersArray = registrationNumbers.split( ',' );
				// update the isBookmarked field for the target siblingGroup model
				mare.collections.gallerySiblingGroups.each( function( siblingGroup ) {
					if( _.intersection( registrationNumbersArray, siblingGroup.get( 'registrationNumbers' ).length > 0 ) ) {
						siblingGroup.set( 'isBookmarked', false );
					}
				});
				// emit an event on the collection showing that the sibling group's bookmark has been updated
				// this is bound to the collection so other views bound to the same data ( the details modal ) can respond
				mare.collections.galleryChildren.trigger( 'siblingGroupBookmarkUpdated', registrationNumbers, 'remove' );

			}).fail( function( err ) {
				// TODO: Show an error message to the user
				console.log( err );
			});
		},
		// TODO: this can be combined with the handler for sibling groups below
		updateChildBookmarkView: function updateChildBookmarkView( registrationNumber, action ) {

			var targetChild = $( '.media-boxes-container' ).find( "[data-registration-number='" + registrationNumber + "']" );
			var targetButton = targetChild.find( '.bookmark' );

			switch( action ) {
				case 'add':
					// change the icon from a plus to a minus
					targetButton.children( '.bookmark__icon' ).removeClass( 'fa-plus-square-o' ).addClass( 'fa-minus-square-o' );
					targetButton.addClass( 'bookmark--active' );
					break;
				case 'remove':
					// change the icon from a minus to a plus
					targetButton.children( '.bookmark__icon' ).removeClass( 'fa-minus-square-o' ).addClass( 'fa-plus-square-o' );
					targetButton.removeClass( 'bookmark--active' );
					break;
			}

			targetButton.removeClass( 'bookmark--disabled' );
		},

		updateSiblingGroupBookmarkView: function updateSiblingGroupBookmarkView( registrationNumbers, action ) {

			var targetSiblingGroup = $( '.media-boxes-container' ).find( "[data-registration-numbers='" + registrationNumbers + "']" );
			var targetButton = targetSiblingGroup.find( '.bookmark' );

			switch( action ) {
				case 'add':
				// change the icon from a plus to a minus
					targetButton.children( '.bookmark__icon' ).removeClass( 'fa-plus-square-o' ).addClass( 'fa-minus-square-o' );
					targetButton.addClass( 'bookmark--active' );
					break;
				case 'remove':
					// change the icon from a minus to a plus
					targetButton.children( '.bookmark__icon' ).removeClass( 'fa-minus-square-o' ).addClass( 'fa-plus-square-o' );
					targetButton.removeClass( 'bookmark--active' );
					break;
			}

			targetButton.removeClass( 'bookmark--disabled' );
		},

		/* sort the children in the gallery */
		sortGallery: function sortGallery( event ) {
			var $currentTarget = $( event.currentTarget );
			var sortBy = $currentTarget.val();

			mare.collections.galleryChildren.reorder( sortBy );
		}
	});
}());
