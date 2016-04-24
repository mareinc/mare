(function () {
	'use strict';

	mare.routers.WaitingChildProfiles = Backbone.Router.extend({

		routes: {
			''			: 'loadDefault',
			'gallery'	: 'loadGallery',
			'search'	: 'loadSearch',
			'*other'	: 'loadDefault'
		},

		initialize: function initialize() {
			// Load the view for the waiting child profiles page as a whole
			mare.views.waitingChildProfiles = mare.views.waitingChildProfiles || new mare.views.WaitingChildProfiles();
		},

		loadGallery: function loadGallery() {
			// Initialize the view for the gallery if it doesn't already exist
			// TODO: Test to see if this can be removed as the sub-views are created when the containing waitingChildProfiles view is created
			mare.views.gallery = mare.views.gallery || new mare.views.Gallery();
			// Use the view for the waiting child profiles page as a whole to display the correct area
			mare.views.waitingChildProfiles.showGallery();
		},

		loadSearch: function loadSearch() {
			// Initialize the view for the search form if it doesn't already exist
			// TODO: Test to see if this can be removed as the sub-views are created when the containing waitingChildProfiles view is created
			mare.views.gallerySearchForm = mare.views.gallerySearchForm || new mare.views.GallerySearchForm();
			// Use the view for the waiting child profiles page as a whole to display the correct area
			mare.views.waitingChildProfiles.showSearchForm();
		},

		/* 	Handle any poorly formed routes or navigation to the waiting child profiles page without specifying a route by rerouting to the gallery */
		loadDefault: function loadDefault() {
			this.navigate( 'gallery', { trigger: true, replace: true } );
		}

	});

})();