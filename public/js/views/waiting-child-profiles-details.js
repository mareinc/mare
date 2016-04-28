(function () {
	'use strict';

	mare.views.ChildDetails = Backbone.View.extend({
		// This view controls the content of the modal window, create an element to insert into the modal
		tagName: 'section',
		// Give the container for our view a class we can hook into
  		className: 'child-details',

		initialize: function initialize() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// Create a hook to access the gallery template
			var html = $('#child-details-template').html();
			// Compile the template to be used during rendering/repainting the gallery
			this.template = Handlebars.compile(html);
			// Initialize the details modal once we've fetched the basic child data, this is needed because the details will be appended to the same collection
			mare.promises.childrenDataLoaded.done(function() {
				view.collection = mare.collections.children;
				// Bind event handler for when child details are returned
				view.on('child-details-loaded', view.render);
			});
		},

		bindEvents: function bindEvents() {
  			$('.modal__close').click(this.closeModal);
			$('.profile-navigation__previous').click(this.handleNavClick);
			$('.profile-navigation__next').click(this.handleNavClick);
		},

		unbindEvents: function unbindEvents() {
			$('.modal__close').unbind('click');
			$('.profile-navigation__previous').unbind('click');
			$('.profile-navigation__next').unbind('click');
		},

		render: function render(childModel) {
			// Depending on the order of the collection, the next and previous differs per rendering
			this.setNavigation(childModel);
			// Pass the child model to through the template we stored during initialization
			var html = this.template(childModel.toJSON());
			this.$el.html(html);
			// Render the contents area and tabs
			$('.modal-container__contents').html(this.$el);
			// Remove the loading indicator and display the details content
			$('.modal-container__loading').fadeOut(function() {
				$('.modal-container__contents').fadeIn();
			});
			// Set a data attribute with the displayed child's id for use in next/prev navigation
			this.$el.attr('data-registration-number', childModel.get('registrationNumber'));
			// Set up the modal tab click events
			this.initializeModalTabs();
			// Bind click events for the newly rendered elements
			this.bindEvents();

		},

		setNavigation: function setNavigation(childModel) {
			// Get the index of the current child model in the children collection
			var childIndex = this.collection.indexOf(childModel);
			// Check to see if there are children to navigate to before and after the currently displayed child
			var hasPrevious = childIndex > 0;
			var hasNext = childIndex !== this.collection.length - 1;
			// Set the index of the previous/next child for easy access in the collection
			var previousIndex = hasPrevious ? childIndex - 1 : undefined;
			var nextIndex = hasNext ? childIndex + 1 : undefined;
			// Set whether there are previous and next children, as well as their indices, so we have the information during rendering
			childModel.set('hasPrevious', hasPrevious);
			childModel.set('hasNext', hasNext);
			childModel.set('previousIndex', previousIndex);
			childModel.set('nextIndex', nextIndex);
		},

		getChildByRegistrationNumber: function getChildByRegistrationNumber(registrationNumber) {
			// Find the child with the matching registration number and store it in childModel
			var childModel = this.collection.find(function(child) {
				return child.get('registrationNumber') === registrationNumber;
			});
			// Return the matching child model
			return childModel;
		},

		getChildByIndex: function getChildByIndex(index) {
			// Fetch the child at the specified index in the children collection
			return this.collection.at(index);

		},

		/* When a child card is clicked, display detailed information for that child in a modal window */
		handleGalleryClick: function handleGalleryClick(event) {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;

			var selectedChild		= $(event.currentTarget),
				registrationNumber	= selectedChild.data('registration-number'),
				childModel			= this.getChildByRegistrationNumber(registrationNumber);
			// Open the modal immediately with a loading indicator to keep the site feeling snappy
			this.openModal();
			// Fetch the child details information
			this.getDetails(childModel);
		},

		handleNavClick: function handleNavClick(event) {
			var selectedChild = $(event.currentTarget),
				index = selectedChild.data('child-index');
			// This event is called from a click event so the view context is lost, we need to explicitly call all functions
			var child = mare.views.childDetails.getChildByIndex(index);
			// Fade displayed child details if any are shown, and display the loading indicator
			$('.modal-container__contents').fadeOut(function() {
				$('.modal-container__loading').fadeIn(function() {
					mare.views.childDetails.getDetails(child);
				});
			});
		},

		/* Make a call to fetch data for the current child to show detailed information for */
		getDetails: function getDetails(childModel) {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// Submit a request to the service layer to fetch child data if we don't have it
			if(!childModel.get('hasDetails')) {
				$.ajax({
					dataType: 'json',
					url: '/services/get-child-details',
					type: 'POST',
					data: {
						registrationNumber: childModel.get('registrationNumber')
					}
				}).done(function(childDetails) {
					// Append the new fields to the child model and set a flag so fetch the same child information a second time
					childModel.set(childDetails);
					childModel.set('hasDetails', true);
					// Emit an event when we have new child details to render
					view.trigger('child-details-loaded', childModel);

				}).fail(function(err) {
					// TODO: Show an error message to the user
					console.log(err);
				});
			} else {
				// We already have the child details but still want to show the child so announce that we have the child details
				view.trigger('child-details-loaded', childModel);
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
			$('.modal__background').fadeOut();
			$('.modal__container').fadeOut();

			mare.utils.enablePageScrolling();
			// This event is called from a click event so the view context is lost, we need to explicitly call all functions
			mare.views.childDetails.clearModalContents();
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
			// TODO: possilby pull these and all other elements used regulary into the initialize function prefixed with this
			var $profileTabs = $('.profile-tabs__tab'),
				$selectedTab = $('.profile-tabs__tab--selected'),
				$profileTabContents = $('.profile-tab__contents'),
				$selectedTabContents = $('.profile-tab__contents--selected')

			$profileTabs.removeClass('profile-tabs__tab--selected');
			$profileTabs.first().addClass('profile-tabs__tab--selected');

			$profileTabContents.removeClass('profile-tab__contents--selected');
			$profileTabContents.first().addClass('profile-tab__contents--selected');

			$profileTabs.on('click', function() {
				if($(this).hasClass('profile-tabs__tab--selected')) {
					return;
				}

				var selectedContentType = $(this).data('tab');

				$selectedTab.removeClass('profile-tabs__tab--selected');
				$(this).addClass('profile-tabs__tab--selected');

				$selectedTabContents.removeClass('profile-tab__contents--selected');
				$('[data-contents=' + selectedContentType + ']').addClass('profile-tab__contents--selected');

			});
		}

	});
})();