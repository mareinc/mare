(function () {
	'use strict';

	mare.views.SiblingGroupDetails = Backbone.View.extend({
		// this view controls the content of the modal window, create an element to insert into the modal
		tagName: 'section',
		// give the container for our view a class we can hook into
  		className: 'sibling-group-details',

		initialize: function initialize() {
			// store a reference to this for insde callbacks where context is lost
			var view = this;
			// create a hook to access the gallery template
			var html = $('#sibling-group-details-template').html();
			// compile the template to be used during rendering/repainting the gallery
			this.template = Handlebars.compile(html);
			// initialize the details modal once we've fetched the basic child data, this is needed because the details will be appended to the same collection
			mare.promises.childrenDataLoaded.done(function() {
				view.collection = mare.collections.gallerySiblingGroups;
				// bind event handler for when child details are returned
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
			$( '.profile-navigation__previous' ).click( this.handleNavClick.bind( this ) );
			$( '.profile-navigation__next' ).click( this.handleNavClick.bind( this ) );
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
			// depending on the order of the collection, the next and previous differs per rendering
			this.setNavigation(siblingGroupModel);
			// pass the child model to through the template we stored during initialization
			var html = this.template(siblingGroupModel.toJSON());
			this.$el.html(html);
			// render the contents area and tabs
			$('.modal-container__contents').html(this.$el);
			// remove the loading indicator and display the details content
			$('.modal-container__loading').fadeOut(function() {
				$('.modal-container__contents').fadeIn();
			});
			// set a data attribute with the displayed child's id for use in next/prev navigation
			this.$el.attr('data-registration-number', siblingGroupModel.get('registrationNumber'));
			// set up the modal tab click events
			this.initializeModalTabs();
			// bind click events for the newly rendered elements
			this.bindEvents();

		},

		setNavigation: function setNavigation(siblingGroupModel) {
			// get the index of the current child model in the children collection
			var siblingGroupIndex = this.collection.indexOf(siblingGroupModel);
			// check to see if there are children to navigate to before and after the currently displayed child
			var hasPrevious = siblingGroupIndex > 0;
			var hasNext = siblingGroupIndex !== this.collection.length - 1;
			// set the index of the previous/next child for easy access in the collection
			var previousIndex = hasPrevious ? siblingGroupIndex - 1 : undefined;
			var nextIndex = hasNext ? siblingGroupIndex + 1 : undefined;
			// set whether there are previous and next children, as well as their indices, so we have the information during rendering
			siblingGroupModel.set('hasPrevious', hasPrevious);
			siblingGroupModel.set('hasNext', hasNext);
			siblingGroupModel.set('previousIndex', previousIndex);
			siblingGroupModel.set('nextIndex', nextIndex);
		},

		getSiblingGroupByRegistrationNumber: function getSiblingGroupByRegistrationNumber( registrationNumber ) {
			// find the child with the matching registration number and store it in siblingGroupModel
			var siblingGroupModel = this.collection.find( function( siblingGroup ) {
				return siblingGroup.get( 'registrationNumbers' ).indexOf( registrationNumber ) !== -1;
			});
			// return the matching child model
			return siblingGroupModel;
		},

		getSiblingGroupByIndex: function getSiblingGroupByIndex( index ) {
			// fetch the child at the specified index in the children collection
			return this.collection.at( index );

		},

		/* when a child card is clicked, display detailed information for that child in a modal window */
		handleGalleryClick: function handleGalleryClick( event ) {
			// store a reference to this for insde callbacks where context is lost
			var view = this;

			var selectedSiblingGroup	= $( event.currentTarget ),
				registrationNumbers		= selectedSiblingGroup.data( 'registration-numbers' ),
				firstRegistrationNumber	= parseInt( registrationNumbers.split( ',' )[ 0 ], 10 ),
				siblingGroup			= this.getSiblingGroupByRegistrationNumber( firstRegistrationNumber );
			// open the modal immediately with a loading indicator to keep the site feeling snappy
			this.openModal();
			// fetch the child details information
			this.getDetails( siblingGroup );
		},

		handleNavClick: function handleNavClick( event ) {
			// store a reference to the view for callback functions that lose context
			var view = this;

			this.unbindEvents();

			var selectedSiblingGroup = $( event.currentTarget ),
				index = selectedSiblingGroup.data( 'child-index' );

			var siblingGroup = this.getSiblingGroupByIndex( index );
			// fade displayed child details if any are shown, and display the loading indicator
			$('.modal-container__contents').fadeOut( function() {
				$('.modal-container__loading').fadeIn( function() {
					view.getDetails( siblingGroup );
				});
			});
		},

		/* make a call to fetch data for the current child to show detailed information for */
		getDetails: function getDetails( siblingGroupModel, targetRegistrationNumber ) {
			// store a reference to this for insde callbacks where context is lost
			var view = this;
			// submit a request to the service layer to fetch child data if we don't have it
			if( !siblingGroupModel.get( 'hasDetails' ) ) {
				$.ajax({
					dataType: 'json',
					url: '/services/get-sibling-group-details',
					type: 'POST',
					data: {
						registrationNumber: siblingGroupModel.get( 'registrationNumbers' )[ 0 ]
					}
				}).done( function( siblingGroupDetails ) {
					// append the new fields to the child model and set a flag so fetch the same child information a second time
					siblingGroupModel.set( siblingGroupDetails );
					siblingGroupModel.set( 'hasDetails', true );
					// emit an event when we have new child details to render
					view.trigger( 'sibling-group-details-loaded', siblingGroupModel );

				}).fail( function( err ) {
					// TODO: show an error message to the user
					console.log( err );
				});
			} else {
				// we already have the child details but still want to show the child so announce that we have the child details
				view.trigger( 'sibling-group-details-loaded', siblingGroupModel );
			}
		},

		/* open the modal container */
		// TODO: this should be moved to a more appropriate location that's accessible to all pages
		openModal: function openModal() {
			$('.modal__background').fadeIn();
			$('.modal-container__contents').hide();
			$('.modal-container__loading').show();
			$('.modal__container').fadeIn();

			mare.utils.disablePageScrolling();
		},

		/* close the modal container */
		// TODO: this should be moved to a more appropriate location that's accessible to all pages
		closeModal: function closeModal() {

			this.unbindEvents();

			$('.modal__background').fadeOut();
			$('.modal__container').fadeOut();

			mare.utils.enablePageScrolling();

			this.clearModalContents();
		},

		/* clear out the current contents of the modal */
		// TODO: this should be moved to a more appropriate location that's accessible to all pages
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
			// get the sibling group's registration numbers to match them in the database
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
