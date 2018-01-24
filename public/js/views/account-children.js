(function () {
	'use strict';

	mare.views.AccountChildren = Backbone.View.extend({
		el: '.account-children-container',

		initialize: function initialize() {
			// create a hook to access the section template
			var html = $( '#account-children' ).html();
			// compile the templates to be used during rendering/repainting the different sections
			this.template = Handlebars.compile( html );

			// DOM cache any commonly used elements to improve performance
			this.$gallery					= this.$( '.gallery' );
			this.$childProfilesHeaderCard 	= this.$( '.gallery section.card' );

			// create a collection to hold only the children currently displayed in the gallery
			mare.collections.galleryChildren = mare.collections.galleryChildren || new mare.collections.Children();
			// create a collection to hold only the sibling groups currently displayed in the gallery
			mare.collections.gallerySiblingGroups = mare.collections.gallerySiblingGroups || new mare.collections.SiblingGroups();

			// create a promise to resolve once we have data for all children the user is allowed to see
			mare.promises.childrenDataLoaded = $.Deferred();
			// fetch children the current user is allowed to view
			this.getChildren();

			// initialize views for the gallery
			mare.views.accountGallery = mare.views.accountGallery || new mare.views.Gallery();
		},

		render: function render() {
			// compile the template
			var html = this.template();
			// render the template to the page
			this.$el.html( html );
			// render the child gallery
			this.renderChildGallery();
		},
		
		hide: function hide() {
			// hide the section
			this.$el.hide();
		},

		show: function show() {
			this.$el.show();
		},

		/* get all children information the user is allowed to view.  This only includes data to show in the gallery cards, no detailed information
		   which is fetched as needed to save bandwidth */
		getChildren: function getChildren() {
			$.ajax({
				dataType: 'json',
				url: '/services/get-children-data',
				type: 'POST'
			}).done( function( children ) {
				// store all children in the collecction for the current gallery display as we always start showing the full list
				mare.collections.galleryChildren.add( children.soloChildren );
				// Store all sibling groups for the current gallery display
				mare.collections.gallerySiblingGroups.add( children.siblingGroups );
				// resolve the promise tracking child data loading
				mare.promises.childrenDataLoaded.resolve();

			}).fail( function( err ) {
				// TODO: show an error message instead of the gallery if we failed to fetch the child data
				console.log( err );
			});
		},

		renderChildGallery: function renderChildGallery() {
			// hide the search form
			mare.views.waitingChildProfiles.$searchForm.hide();
			// hide the child profiles header section
			mare.views.waitingChildProfiles.$childProfilesHeaderCard.hide();
			// show the gallery
			mare.views.waitingChildProfiles.$gallery.show();
			// render the gallery
			mare.views.gallery.render();
		}
	});
}());
