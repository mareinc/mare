(function () {
	'use strict';

	mare.views.Gallery = Backbone.View.extend({
		// This view controls everything inside the element with class 'gallery'
		el: '.gallery',

		events: {
			'click .child-media-box'						: 'displayChildDetails',
			'click .sibling-group-media-box'				: 'displaySiblingGroupDetails',
			'click .child-bookmark'							: 'toggleChildBookmark',
			'click .sibling-group-bookmark'					: 'toggleSiblingGroupBookmark',
			'change .waiting-child-profiles__gallery-filter': 'sortGallery'
		},

		initialize: function initialize() {
			// Store a reference to this for insde callbacks where context is lost
			var view							= this;
			// Create a hook to access the gallery template
			var galleryChildrenHtml				= $( '#gallery-children-template' ).html();
			var gallerySiblingGroupsHtml		= $( '#gallery-sibling-groups-template' ).html();
			// Compile the templates to be used during rendering/repainting the gallery
			this.childrenTemplate				= Handlebars.compile( galleryChildrenHtml );
			this.siblingGroupsTemplate			= Handlebars.compile( gallerySiblingGroupsHtml )
			// Initialize a subview for the details modals
			mare.views.childDetails				= mare.views.childDetails || new mare.views.ChildDetails();
			mare.views.siblingGroupDetails		= mare.views.siblingGroupDetails || new mare.views.SiblingGroupDetails();
			// Initialize the gallery once we've fetched the child data needed to display the gallery (this doesn't include child details data)
			mare.promises.childrenDataLoaded.done( function() {
				view.childrenCollection			= mare.collections.galleryChildren;
				view.siblingGroupsCollection	= mare.collections.gallerySiblingGroups;
			});

			// Bind to change events
			mare.collections.galleryChildren.on( 'sorted', function() {
				view.render();
			});
		},

		render: function render() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// The gallery can't render until we have the user permissions and the child data is loaded
			// use the promise bound to both data to delay rendering until we have them
			$.when( mare.promises.permissionsLoaded, mare.promises.childrenDataLoaded ).then( function() {
				// Pass the collection data through the gallery template to generate the HTML to be added to the gallery
				var childrenHtml		= view.childrenTemplate( view.childrenCollection.toJSON() );
				var siblingGroupsHtml	= view.siblingGroupsTemplate( view.siblingGroupsCollection.toJSON() );

				view.$( '.profiles-container' ).html( childrenHtml + siblingGroupsHtml );
				// Once the html is rendered to the page, initialize the gallery display plugin
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

		/* When a child card is clicked, pass the request to the subview in charge of the details modal */
		displayChildDetails: function displayChildDetails( event ) {

			mare.views.childDetails.handleGalleryClick( event );
		},

		/* When a sibling group card is clicked, pass the request to the subview in charge of the details modal */
		displaySiblingGroupDetails: function displayChildDetails( event ) {

			mare.views.siblingGroupDetails.handleGalleryClick( event );
		},

		/* Determine how to handle a click on the bookmark button based on the current state of the bookmark */
		toggleChildBookmark: function toggleChildBookmark( event ) {

			event.stopPropagation();
			// DOM cache the current target for performance
			var $currentTarget = $( event.currentTarget );
			// Get the child's registration number to match them in the database
			var registrationNumber = $currentTarget.closest( '.media-box' ).data( 'registration-number' );

			// if we are currently saving the users attempt to toggle the bookmark and the server hasn't processed the change yet, ignore the click event
			if( $currentTarget.hasClass( 'bookmark--disabled' ) ) {

				return;

			// if the child is currently bookmarked, remove them
			} else if( $currentTarget.hasClass( 'bookmark--active' ) ) {

				$currentTarget.addClass( 'bookmark--disabled' );
				this.removeChildBookmark( registrationNumber, $currentTarget );

			// if the child is not currently bookmarked, add them
			} else {

				$currentTarget.addClass( 'bookmark--disabled' );
				this.addChildBookmark( registrationNumber, $currentTarget );

			}
		},

		toggleSiblingGroupBookmark: function toggleSiblingGroupBookmark( event ) {

			event.stopPropagation();
			// DOM cache the current target for performance
			var $currentTarget = $( event.currentTarget );
			// Get the child's registration number to match them in the database
			var registrationNumbers = $currentTarget.closest( '.media-box' ).data( 'registration-numbers' );

			// if we are currently saving the users attempt to toggle the bookmark and the server hasn't processed the change yet, ignore the click event
			if( $currentTarget.hasClass( 'bookmark--disabled' ) ) {

				return;

			// if the child is currently bookmarked, remove them
			} else if( $currentTarget.hasClass( 'bookmark--active' ) ) {

				$currentTarget.addClass( 'bookmark--disabled' );
				this.removeSiblingGroupBookmark( registrationNumbers, $currentTarget );

			// if the child is not currently bookmarked, add them
			} else {

				$currentTarget.addClass( 'bookmark--disabled' );
				this.addSiblingGroupBookmark( registrationNumbers, $currentTarget );

			}
		},

		addChildBookmark: function addChildBookmark( registrationNumber, $currentTarget ) {

			$.ajax({
				url: '/services/add-child-bookmark',
				type: 'POST',
				data: {
					registrationNumber: registrationNumber
				}
			}).done( function( response ) {
				// Once the bookmark has been saved successfully, change the icon, re-enable the bookmark, and show it as active
				$currentTarget.children( '.bookmark__icon' ).removeClass( 'fa-plus-square-o' ).addClass( 'fa-minus-square-o' );
				$currentTarget.removeClass( 'bookmark--disabled' );
				$currentTarget.addClass( 'bookmark--active' );

			}).fail( function( err ) {
				// TODO: Show an error message to the user
				console.log( err );
			});

		},

		removeChildBookmark: function removeChildBookmark( registrationNumber, $currentTarget ) {

			$.ajax({
				url: '/services/remove-child-bookmark',
				type: 'POST',
				data: {
					registrationNumber: registrationNumber
				}
			}).done( function( response ) {
				// Once the bookmark has been removed successfully, change the icon, re-enable the bookmark, and show it as inactive
				$currentTarget.children( '.bookmark__icon' ).removeClass( 'fa-minus-square-o' ).addClass( 'fa-plus-square-o' );
				$currentTarget.removeClass( 'bookmark--disabled' );
				$currentTarget.removeClass( 'bookmark--active' );

			}).fail( function( err ) {
				// TODO: Show an error message to the user
				console.log( err );
			});

		},

		addSiblingGroupBookmark: function addSiblingGroupBookmark( registrationNumbers, $currentTarget ) {

			$.ajax({
				url: '/services/add-sibling-group-bookmark',
				type: 'POST',
				data: {
					registrationNumbers: registrationNumbers
				}
			}).done( function( response ) {
				// Once the bookmark has been saved successfully, change the icon, re-enable the bookmark, and show it as active
				$currentTarget.children( '.bookmark__icon' ).removeClass( 'fa-plus-square-o' ).addClass( 'fa-minus-square-o' );
				$currentTarget.removeClass( 'bookmark--disabled' );
				$currentTarget.addClass( 'bookmark--active' );

			}).fail( function( err ) {
				// TODO: Show an error message to the user
				console.log( err );
			});
		},

		removeSiblingGroupBookmark: function removeSiblingGroupBookmark( registrationNumbers, $currentTarget ) {

			$.ajax({
				url: '/services/remove-sibling-group-bookmark',
				type: 'POST',
				data: {
					registrationNumbers: registrationNumbers
				}
			}).done( function( response ) {
				// Once the bookmark has been removed successfully, change the icon, re-enable the bookmark, and show it as inactive
				$currentTarget.children( '.bookmark__icon' ).removeClass( 'fa-minus-square-o' ).addClass( 'fa-plus-square-o' );
				$currentTarget.removeClass( 'bookmark--disabled' );
				$currentTarget.removeClass( 'bookmark--active' );

			}).fail( function( err ) {
				// TODO: Show an error message to the user
				console.log( err );
			});
		},

		sortGallery: function sortGallery( event ) {
			var $currentTarget = $( event.currentTarget );
			var sortBy = $currentTarget.val();

			mare.collections.galleryChildren.reorder( sortBy );
		}
	});
}());
