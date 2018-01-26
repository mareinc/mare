(function () {
	'use strict';

	mare.views.AccountChildren = Backbone.View.extend({
		el: '.account-children-container',

		initialize: function initialize() {
			// create a hook to access the section template
			var html = $( '#account-children' ).html();
			// compile the templates to be used during rendering/repainting the different sections
			this.template = Handlebars.compile( html );

			// create a collection to hold only the children currently displayed in the gallery
			mare.collections.galleryChildren = mare.collections.galleryChildren || new mare.collections.Children();
			// create a collection to hold only the sibling groups currently displayed in the gallery
			mare.collections.gallerySiblingGroups = mare.collections.gallerySiblingGroups || new mare.collections.SiblingGroups();

			// create a promise to resolve once we have data for all children the user is allowed to see
			mare.promises.childrenDataLoaded = $.Deferred();
			// fetch children the current user is allowed to view
			this.getChildren();
		},

		render: function render() {
			// compile the template
			var html = this.template();
			// render the template to the page
			this.$el.html( html );

			// TODO: refactor the gallery rendering process so that it is not dependent on the account-children view render
			this.$( '.gallery section.card' ).hide();
			this.$( '.gallery' ).show();

			// initialize views for the gallery.  This is done here as the view will attempt to bind it's el to
			// DOM that's rendered in this function
			mare.views.accountGallery = mare.views.accountGallery || new mare.views.Gallery();

			// render the child gallery view
			mare.views.accountGallery.render();
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
				type: 'POST',
				data: { requestPage: 'account' }
			}).done( function( responseData ) {

				if ( responseData.status === 'success' ) {
					
					// store all children in the collecction for the current gallery display as we always start showing the full list
					mare.collections.galleryChildren.add( responseData.soloChildren );
					// Store all sibling groups for the current gallery display
					mare.collections.gallerySiblingGroups.add( responseData.siblingGroups );
					// resolve the promise tracking child data loading
					mare.promises.childrenDataLoaded.resolve();
				} else if ( responseData.status === 'error' ) {

					// log handled errors
					// TODO: potentially implement a flash message error
					console.error( responseData.message );
				} else {
					
					// log unhandled errors
					console.error( responseData );
				}
				

			}).fail( function( err ) {
				// TODO: show an error message instead of the gallery if we failed to fetch the child data
				console.error( err );
			});
		}
	});
}());
