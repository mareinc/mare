(function () {
	'use strict';

	mare.views.Sidebar = Backbone.View.extend({
		el: 'body',

		events: {
			'click .button--donate'				: 'navigate',
			'click .button--have-a-question'	: 'navigate'
		},
		// TODO: Consider making this a utility function since it's used on several pages
		navigate: function navigate( event ) {
        	window.location.href = $( event.currentTarget ).data( 'url' );
        }

	});
}());
