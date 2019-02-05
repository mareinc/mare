(function () {
	'use strict';

	mare.views.AccountEmailList = Backbone.View.extend({
		el: '.account-email-list-container',
		
		events: {
			'click .save-button'	: 'updateMailingLists'
		},

		initialize: function initialize() {
			// create a hook to access the section templates
			var html = $( '#account-email-list' ).html();
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
		},
		
		updateMailingLists: function( event ) {
			// fetch the form data
			var data = [];
			this.$el.find( "input[type='radio']:checked" ).each( function( index, element ) {
				var value = $( element ).val();
				if ( value.length > 0 ) {
					data.push( value );
				}
			} );
			
			// send a put request to the server with the updated information
			$.ajax({
				type: 'PUT',
				url: 'account/user-email-lists',
				data: {
					emailLists: data
				},
				success: function( responseData ) {
					// display a flash message with the resulting status of the update action
					mare.views.flashMessages.initializeAJAX( responseData.flashMessage );
				}
			});
		}
	});
}());
