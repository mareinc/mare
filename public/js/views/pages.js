( function () {
	'use strict';

	mare.views.Pages = Backbone.View.extend({
		el: 'body',

        events: {
			'click .page__action-button': 'navigate'
		},
		// TODO: consider putting this in a more global space since it's used for button navigation
        navigate: function navigate( event ) {
        	window.location.href = $( event.currentTarget ).data( 'url' );
        }
	});
}());
