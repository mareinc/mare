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
		},
		
		hide: function hide() {
			// hide the section
			this.$el.hide();
			// remove the contents of the view
			this.$el.empty();
			// NOTE: if any events are bound to DOM elements, they should be explicitly removed here as well
		},

		show: function show() {
			this.$el.show();
		}
	});
}());
