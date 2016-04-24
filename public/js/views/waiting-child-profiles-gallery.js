(function () {
	'use strict';

	mare.views.Gallery = Backbone.View.extend({
		// This view controls everything inside the element with class 'gallery'
		el: '.gallery',

		events: {
			'click .media-box'						: 'displayChildDetails',
			'click .bookmark'						: 'toggleBookmark'
		},

		initialize: function() {
			// Initialize a subview for the details modal
			mare.views.childDetails = mare.views.childDetails || new mare.views.ChildDetails();
			// Initialize the gallery once we've fetch the child data used to show child details
			this.initializeMediaBoxes();
		},

		initializeMediaBoxes: function initializeMediaBoxes() {
			// initialize the photo listing gallery grid
			$('#grid').mediaBoxes({
				boxesToLoadStart: 12,
				boxesToLoad 	: 8,
				sortContainer 	: '#waiting-child-profiles-sort',
				getSortData: {
					name		: '.media-box-name', // look in the elements with the class "media-box-name" and sort by the innerHTML value
					age			: '.media-box-age', // look in the elements with the class "media-box-age" and sort by the innerHTML value
					dateAdded	: '.media-box-date-added' // look in the elements with the class "media-box-date-added" and sort by the innerHTML value
				}
			});
		},

		/* When a child card is clicked, pass the request to the subview in charge of the details modal */
		displayChildDetails: function displayChildDetails(event) {
			mare.views.childDetails.displayChildDetails(event);
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