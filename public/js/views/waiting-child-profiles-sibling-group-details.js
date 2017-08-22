(function () {
	'use strict';

	mare.views.SiblingGroupDetails = Backbone.View.extend({
		// This view controls the content of the modal window, create an element to insert into the modal
		tagName: 'section',
		// Give the container for our view a class we can hook into
  		className: 'sibling-group-details',

		initialize: function initialize() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// Create a hook to access the gallery template
			var html = $('#sibling-group-details-template').html();
			// Compile the template to be used during rendering/repainting the gallery
			this.template = Handlebars.compile(html);
			// Initialize the details modal once we've fetched the basic child data, this is needed because the details will be appended to the same collection
			mare.promises.childrenDataLoaded.done(function() {
				view.collection = mare.collections.gallerySiblingGroups;
				// Bind event handler for when child details are returned
				view.on('sibling-group-details-loaded', view.render);
			});
			// when we get a response from the server that the bookmark for a sibling group has successfully updated, update the view
			mare.collections.galleryChildren.on( 'siblingGroupBookmarkUpdated', function( registrationNumbers, action ) {
				view.updateBookmarkButton( registrationNumbers, action );
			});
		},
		// events need to be bound every time the modal is opened, so they can't be put in an event block
		bindEvents: function bindEvents() {
  			$( '.modal__close' ).click( this.closeModal.bind( this ) );
			$( '.profile-navigation__previous' ).click( this.handleNavClick );
			$( '.profile-navigation__next' ).click( this.handleNavClick );
			$( '.sibling-group-bookmark-button' ).click(  this.broadcastBookmarkUpdateEvent );
		},
		// events need to be unbound every time the modal is closed
		unbindEvents: function unbindEvents() {
			$( '.modal__close' ).unbind( 'click' );
			$( '.profile-navigation__previous' ).unbind( 'click' );
			$( '.profile-navigation__next' ).unbind( 'click' );
			$( '.sibling-group-bookmark-button' ).unbind( 'click' );
			$( '.profile-tabs__tab' ).unbind( 'click' );
		},

		render: function render(siblingGroupModel) {
			// Depending on the order of the collection, the next and previous differs per rendering
			this.setNavigation(siblingGroupModel);
			// Pass the child model to through the template we stored during initialization
			var html = this.template(siblingGroupModel.toJSON());
			this.$el.html(html);
			// Render the contents area and tabs
			$('.modal-container__contents').html(this.$el);
			// Remove the loading indicator and display the details content
			$('.modal-container__loading').fadeOut(function() {
				$('.modal-container__contents').fadeIn();
			});
			// Set a data attribute with the displayed child's id for use in next/prev navigation
			this.$el.attr('data-registration-number', siblingGroupModel.get('registrationNumber'));
			// Set up the modal tab click events
			this.initializeModalTabs();
			// Bind click events for the newly rendered elements
			this.bindEvents();

		},

		setNavigation: function setNavigation(siblingGroupModel) {
			// Get the index of the current child model in the children collection
			var siblingGroupIndex = this.collection.indexOf(siblingGroupModel);
			// Check to see if there are children to navigate to before and after the currently displayed child
			var hasPrevious = siblingGroupIndex > 0;
			var hasNext = siblingGroupIndex !== this.collection.length - 1;
			// Set the index of the previous/next child for easy access in the collection
			var previousIndex = hasPrevious ? siblingGroupIndex - 1 : undefined;
			var nextIndex = hasNext ? siblingGroupIndex + 1 : undefined;
			// Set whether there are previous and next children, as well as their indices, so we have the information during rendering
			siblingGroupModel.set('hasPrevious', hasPrevious);
			siblingGroupModel.set('hasNext', hasNext);
			siblingGroupModel.set('previousIndex', previousIndex);
			siblingGroupModel.set('nextIndex', nextIndex);
		},

		getSiblingGroupByRegistrationNumber: function getSiblingGroupByRegistrationNumber( registrationNumber ) {
			// Find the child with the matching registration number and store it in siblingGroupModel
			var siblingGroupModel = this.collection.find( function( siblingGroup ) {
				return siblingGroup.get( 'registrationNumbers' ).indexOf( registrationNumber ) !== -1;
			});
			// Return the matching child model
			return siblingGroupModel;
		},

		getSiblingGroupByIndex: function getSiblingGroupByIndex( index ) {
			// Fetch the child at the specified index in the children collection
			return this.collection.at( index );

		},

		/* When a child card is clicked, display detailed information for that child in a modal window */
		handleGalleryClick: function handleGalleryClick( event ) {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;

			var selectedSiblingGroup	= $( event.currentTarget ),
				registrationNumbers		= selectedSiblingGroup.data( 'registration-numbers' ),
				firstRegistrationNumber	= parseInt( registrationNumbers.split( ',' )[ 0 ], 10 ),
				siblingGroupModel		= this.getSiblingGroupByRegistrationNumber( firstRegistrationNumber );
			// Open the modal immediately with a loading indicator to keep the site feeling snappy
			this.openModal();
			// Fetch the child details information
			this.getDetails( siblingGroupModel, firstRegistrationNumber );
		},

		handleNavClick: function handleNavClick( event ) {
			// This event is called from a click event so the view context is lost, we need to explicitly call all functions
			mare.views.siblingGroupDetails.unbindEvents();

			var selectedSiblingGroup = $( event.currentTarget ),
				index = selectedSiblingGroup.data( 'child-index' );

			var siblingGroup = mare.views.siblingGroupDetails.getSiblingGroupByIndex( index );
			// Fade displayed child details if any are shown, and display the loading indicator
			$('.modal-container__contents').fadeOut( function() {
				$('.modal-container__loading').fadeIn( function() {
					mare.views.siblingGroupDetails.getDetails( siblingGroup );
				});
			});
		},

		/* Make a call to fetch data for the current child to show detailed information for */
		getDetails: function getDetails( siblingGroupModel, targetRegistrationNumber ) {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// Submit a request to the service layer to fetch child data if we don't have it
			if( !siblingGroupModel.get( 'hasDetails' ) ) {
				$.ajax({
					dataType: 'json',
					url: '/services/get-sibling-group-details',
					type: 'POST',
					data: {
						registrationNumber: targetRegistrationNumber
					}
				}).done( function( siblingGroupDetails ) {
					// Append the new fields to the child model and set a flag so fetch the same child information a second time
					siblingGroupModel.set( siblingGroupDetails );
					siblingGroupModel.set( 'hasDetails', true );
					// Emit an event when we have new child details to render
					view.trigger( 'sibling-group-details-loaded', siblingGroupModel );

				}).fail( function( err ) {
					// TODO: Show an error message to the user
					console.log( err );
				});
			} else {
				// We already have the child details but still want to show the child so announce that we have the child details
				view.trigger( 'sibling-group-details-loaded', siblingGroupModel );
			}
		},

		/* Open the modal container */
		// TODO: This should be moved to a more appropriate location that's accessible to all pages
		openModal: function openModal() {
			$('.modal__background').fadeIn();
			$('.modal-container__contents').hide();
			$('.modal-container__loading').show();
			$('.modal__container').fadeIn();

			mare.utils.disablePageScrolling();
		},

		/* Close the modal container */
		// TODO: This should be moved to a more appropriate location that's accessible to all pages
		closeModal: function closeModal() {

			this.unbindEvents();

			$('.modal__background').fadeOut();
			$('.modal__container').fadeOut();

			mare.utils.enablePageScrolling();

			this.clearModalContents();
		},

		/* Clear out the current contents of the modal */
		// TODO: This should be moved to a more appropriate location that's accessible to all pages
		clearModalContents: function clearModalContents() {
			$('.modal-container__contents').html('');
		},

		/* initialize tabbing within the modal window */
		// TOOD: consider making this more generic and pulling it into a location that's accessible to all pages
		initializeModalTabs: function initializeModalTabs() {
			// DOM cache any commonly used elements to improve performance
			var $profileTabs = $('.profile-tabs__tab')

			$profileTabs.on('click', function() {
				// DOM cache any commonly used elements to improve performance
				var $selectedTab			= $('.profile-tabs__tab--selected'),
					$selectedTabContents	= $('.profile-tab__contents--selected');

				if($(this).hasClass('profile-tabs__tab--selected')) {
					return;
				}

				var selectedContentType = $(this).data('tab');

				$selectedTab.removeClass('profile-tabs__tab--selected');
				$(this).addClass('profile-tabs__tab--selected');

				$selectedTabContents.removeClass('profile-tab__contents--selected');
				$('[data-contents=' + selectedContentType + ']').addClass('profile-tab__contents--selected');

			});
		},

		/* toggle whether the child is bookmarked */
		broadcastBookmarkUpdateEvent: function broadcastBookmarkUpdateEvent( event ) {
			// DOM cache the current target for performance
			var $currentTarget = $( event.currentTarget );
			// Get the sibling group's registration numbers to match them in the database
			var registrationNumbers = $currentTarget.data( 'registration-numbers' );

			// if we are currently saving the users attempt to toggle the bookmark and the server hasn't processed the change yet, ignore the click event
			if( $currentTarget.hasClass( 'button--disabled' ) ) {

				return;

			// if the sibling group is currently bookmarked, remove them
			} else if( $currentTarget.hasClass( 'button--active' ) ) {

				$currentTarget.addClass( 'button--disabled' );
				// send an event that the bookmark needs to be updated
				mare.collections.galleryChildren.trigger( 'siblingGroupBookmarkUpdateNeeded', registrationNumbers, 'remove' );

			// if the sibling group is not currently bookmarked, add them
			} else {

				$currentTarget.addClass( 'button--disabled' );
				// send an event that the bookmark needs to be updated
				mare.collections.galleryChildren.trigger( 'siblingGroupBookmarkUpdateNeeded', registrationNumbers, 'add' );

			}
		},

		updateBookmarkButton: function updateBookmarkButton( registrationNumbers, action ) {

			var targetButton = $('.sibling-group-bookmark-button[data-registration-numbers="' + registrationNumbers + '"]')

			switch( action ) {
				case 'add':
					// change the icon from a plus to a minus
					targetButton.html( 'Remove Bookmark' );
					targetButton.addClass( 'button--active' );
					break;
				case 'remove':
					// change the icon from a minus to a plus
					targetButton.html( 'Bookmark' );
					targetButton.removeClass( 'button--active' );
					break;
			}

			targetButton.removeClass( 'button--disabled' );
		}

	});
}());
