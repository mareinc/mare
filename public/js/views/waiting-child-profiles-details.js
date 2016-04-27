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
			var childDetailsHtml = $('#child-details-template').html();
			// Compile the template to be used during rendering/repainting the gallery
			this.template = Handlebars.compile(childDetailsHtml);
			// Initialize the details modal once we've fetched the basic child data, this is needed because the details will be appended to the same collection
			mare.promises.childrenDataLoaded.done(function() {
				view.collection = mare.collections.children;
				// Bind event handlers
				view.collection.on('child-details-loaded', view.render);
			});
		},

		render: function render(childModel) {
			// Get the index of the current child model in the children collection
			var childIndex = mare.collections.children.indexOf(childModel);
			// Check to see if there are children to navigate to before and after the currently displayed child
			var hasPreviousChild = childIndex > 0;
			var hasNextChild = childIndex !== mare.collections.children.length - 1;
			// Set whether there are previous and next children on the model so we have access to the information during rendering
			childModel.set('hasPreviousChild', hasPreviousChild);
			childModel.set('hasNextChild', hasNextChild);
			// Pass the child model to through the template we stored during initialization
			var html = this.template(childModel.toJSON());
			// Render the contents area and tabs
			$('.modal-container__contents').html(html);
			// Remove the loading indicator and display the details content
			$('.modal-container__loading').fadeOut(function() {
				$('.modal-container__contents').fadeIn();
			});
			// Set up the modal tab click events
			// TODO: combine these with the generic bindEvents function below
			this.initializeModalTabs();
			// Set up binding for all events in the modal
			this.bindEvents();
		},

		bindEvents: function bindEvents() {
			$('.modal__close').click(this.closeModal);
			$('.profile-navigation__previous').click(this.displayPreviousChildDetails);
			$('.profile-navigation__next').click(this.displayNextChildDetails);
		},

		/* When a child card is clicked, display detailed information for that child in a modal window */
		displayChildDetails: function displayChildDetails(event) {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;

			var selectedChild = $(event.currentTarget),
				registrationNumber = selectedChild.data('registration-number');
			// Open the modal immediately with a loading indicator to keep the site feeling snappy
			this.openModal();
			// Create a promise to determine when the child details have been fetched
			var hasChildDetails = $.Deferred();
			// Fetch the child details information
			this.getChildData(registrationNumber, hasChildDetails);
			// Render the details modal once the child data is returned
			hasChildDetails.done(function(childModel) {
				view.render(childModel);
			});
		},

		/* Look at the current child, then traverse the DOM to determine which child to dislpay next */
		displayNextChildDetails: function displayNextChildDetails(event) {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;

			var selectedChild = $(event.currentTarget),
				registrationNumber = selectedChild.data('registration-number');

			$('.modal-container__contents').fadeOut(function() {

				view.clearModalContents();

				$('.modal-container__loading').fadeIn(function() {
					view.getChildData(registrationNumber);
				});

			});
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
		},

		/* Make a call to fetch data for the current child to show detailed information for */
		// TODO: once we have the general data pulled into a Backbone collection, this should be driven off the next model, not the next item in the DOM.
		// 		 this change should also fix the bug where next/previous shows the wrong child based on DOM sorting
		getChildData: function getChildData(registrationNumber, hasChildDetails) {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// Fetch the model for the child we requested details about
			var childModel = this.collection.find(function(child) {
				return child.get('registrationNumber') === registrationNumber;
			});
			// Submit a request to the service layer to fetch child data if we don't have it
			if(!childModel.get('hasDetails')) {
				$.ajax({
					dataType: 'json',
					url: '/services/get-child-details',
					type: 'POST',
					data: {
						registrationNumber: registrationNumber
					}
				}).done(function(childDetails) {
					// Append the new fields to the child model and set a flag so fetch the same child information a second time
					childModel.set(childDetails);
					childModel.set('hasDetails', true);
					// Resolve the promise saying we have the child details
					hasChildDetails.resolve(childModel);

				}).fail(function(err) {
					// TODO: Show an error message to the user
					console.log(err);
				});
			} else {
				// We already have the child details so resolve the promise
				hasChildDetails.resolve(childModel);
			}
		},

		/* Determine how to handle a click on the bookmark button based on the current state of the bookmark */
		toggleBookmark: function toggleBookmark(e) {
			e.stopPropagation();
			// DOM cache the current target for performance
			var $currentTarget = $(e.currentTarget);
			// Get the child's registration number to match them in the database
			var registrationNumber = $currentTarget.closest('.media-box').data('registration-number');

			// if we are currently saving the users attempt to toggle the bookmark and the server hasn't processed the change yet, ignore the click event
			if( $currentTarget.hasClass('bookmark--disabled') ) {

				return;

			// if the child is currently bookmarked, remove them
			} else if( $currentTarget.hasClass('bookmark--active') ) {

				$currentTarget.addClass('bookmark--disabled');
				this.removeBookmark(registrationNumber, $currentTarget);

			// if the child is not currently bookmarked, add them
			} else {

				$currentTarget.addClass('bookmark--disabled');
				this.addBookmark(registrationNumber, $currentTarget);

			}
		},

		addBookmark: function addBookmark(registrationNumber, $currentTarget) {

			$.ajax({
				url: '/services/add-bookmark',
				type: 'POST',
				data: {
					registrationNumber: registrationNumber
				}
			}).done(function(response) {
				// Once the bookmark has been saved successfully, change the icon, re-enable the bookmark, and show it as active
				$currentTarget.children('.bookmark__icon').removeClass('fa-plus-square-o').addClass('fa-minus-square-o');
				$currentTarget.removeClass('bookmark--disabled');
				$currentTarget.addClass('bookmark--active');

			}).fail(function(err) {
				// TODO: Show an error message to the user
				console.log(err);
			});

		},

		removeBookmark: function removeBookmark(registrationNumber, $currentTarget) {

			$.ajax({
				url: '/services/remove-bookmark',
				type: 'POST',
				data: {
					registrationNumber: registrationNumber
				}
			}).done(function(response) {
				// Once the bookmark has been removed successfully, change the icon, re-enable the bookmark, and show it as inactive
				$currentTarget.children('.bookmark__icon').removeClass('fa-minus-square-o').addClass('fa-plus-square-o');
				$currentTarget.removeClass('bookmark--disabled');
				$currentTarget.removeClass('bookmark--active');

			}).fail(function(err) {
				// TODO: Show an error message to the user
				console.log(err);
			});

		}

	});
})();