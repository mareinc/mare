(function () {
	'use strict';

	mare.views.WaitingChildProfiles = Backbone.View.extend({
		// This view controls everything inside the body element, with the exception of areas controlled by sub-views
		el: 'body',

		events: {
			'click .filters__search-button--modify'	: 'handleSearchClick',
			'click .filters__search-button--clear'	: 'resetGallery'
		},

		initialize: function initialize() {
			var that = this;
			// DOM cache any commonly used elements to improve performance
			this.$gallery		= this.$( '.gallery' );
			this.$searchForm	= this.$( '.gallery-search-form' );

			// Create a collection to hold all available children data as a base for sorting/filtering
			mare.collections.allChildren = mare.collections.allChildren || new mare.collections.Children();
			// Create a collection to hold only the children currently displayed in the gallery
			mare.collections.galleryChildren = mare.collections.galleryChildren || new mare.collections.Children();

			// Create a promise to resolve once we have data for all children the user is allowed to see
			mare.promises.childrenDataLoaded = $.Deferred();
			// Fetch children the current user is allowed to view
			this.getChildren();

			// Initialize views for the gallery and serach form
			mare.views.gallery = mare.views.gallery || new mare.views.Gallery();
			mare.views.gallerySearchForm = mare.views.gallerySearchForm || new mare.views.GallerySearchForm();

			// Bind to change events
			mare.collections.galleryChildren.on('updateComplete', function() {
				that.navigateToGallery();
			});

			mare.collections.galleryChildren.on('resetComplete', function() {
				that.showGallery();
			});

		},

		/* Hide the gallery search form and show the gallery */
		showGallery: function showGallery() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// Fade the search form out and fade the gallery in
			this.$searchForm.fadeOut(function() {
				view.$gallery.fadeIn();
				// Render the gallery
				mare.views.gallery.render();
			});
		},

		/* Hide the gallery and show the gallery search form */
		showSearchForm: function showSearchForm() {
			// Store a reference to this for insde callbacks where context is lost
			var view = this;
			// Fade the gallery out and fade the search form in
			this.$gallery.fadeOut(function() {
				view.$searchForm.fadeIn();
			});
		},

		/* get all children information the user is allowed to view.  This only includes data to show in the gallery cards, no detailed information
		   which is fetched as needed to save bandwidth */
		getChildren: function getChildren() {
			$.ajax({
				dataType: 'json',
				url: '/services/get-children-data',
				type: 'POST'
			}).done(function(data) {

				// Store all children in a collection for easy access
				mare.collections.allChildren.add(data);
				// Store all children in the collecction for the current gallery display as we always start showing the full list
				mare.collections.galleryChildren.add(data);
				// Resolve the promise tracking child data loading
				mare.promises.childrenDataLoaded.resolve();

			}).fail(function(err) {
				// TODO: Show an error message instead of the gallery if we failed to fetch the child data
				console.log(err);
			});
		},
		/* Route to the search form to preserve browser history state */
		handleSearchClick: function handleSearchClick() {
			mare.routers.waitingChildProfiles.navigate( 'search', { trigger: true } );
		},

		navigateToGallery: function navigateToGallery() {
			mare.routers.waitingChildProfiles.navigate( 'gallery', { trigger: true } );
		},

		resetGallery: function resetGallery() {
			// Cache the collection for faster access
			var galleryChildren = mare.collections.galleryChildren;
			// Clear out the contents of the gallery collection
			galleryChildren.reset();
			// Add all children back to the gallery collection for display
			mare.collections.allChildren.each(function(child) {
				galleryChildren.add(child);
			});
			// Emit an event to allow the gallery to update it's display now that we have all matching models
			mare.collections.galleryChildren.trigger('resetComplete');
		}

	});
}());
