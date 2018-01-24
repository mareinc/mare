(function () {
	'use strict';

	mare.views.AccountChildren = Backbone.View.extend({
		el: '.account-children-container',

		initialize: function initialize() {
			// create a hook to access the section template
			var html = $( '#account-children' ).html();
			// compile the templates to be used during rendering/repainting the different sections
			this.template = Handlebars.compile( html );
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

		renderChildGallery: function renderChildGallery() {
			// create a new WaitingChildProfiles view
			mare.views.waitingChildProfiles = mare.views.waitingChildProfiles || new mare.views.WaitingChildProfiles();
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
