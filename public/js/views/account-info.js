(function () {
	'use strict';

	mare.views.AccountInfo = Backbone.View.extend({
		el: '.account-info-container',

		events: {
			'click .save-button'					: 'updateUserInfo',
			'change .social-worker-title-checkbox'	: 'toggleSocialWorkerTitleTextField'
		},

		initialize: function initialize() {
			// DOM cache any commonly used elements to improve performance
			this.$socialWorkerTitle			= this.$( '#social-worker-title' );
			this.$socialWorkerTitleGroup	= this.$( '.social-worker-title-group' );
			// create a hook to access the section templates
			var html 		= $( '#account-info' ).html();
			// compile the templates to be used during rendering/repainting the different sections
			this.template 	= Handlebars.compile( html );
		},

		render: function render() {
			// compile the template
			var html = this.template();
			// render the template to the page
			this.$el.html( html );
		},

		toggleSocialWorkerTitleTextField: function toggleSocialWorkerTitleTextField() {
			// hide/show the hidden 'other' field via the hidden class
			this.$socialWorkerTitleGroup.toggleClass( 'hidden' );

			if( this.$socialWorkerTitleGroup.hasClass( 'hidden' ) ) {
				// store the social worker title to reset the header when the account section is selected again
				this.storedSocialWorkerTitle = this.$socialWorkerTitle.val();
				// clear out the input box since it's hidden and not part of the form submission
				this.$socialWorkerTitle.val( '' );
			} else {
				// if the title group isn't hidden, reset the header with the cached title value
				this.$socialWorkerTitle.val( this.storedSocialWorkerTitle );
			}
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

		updateUserInfo: function updateUserInfo( event ) {
			// prevent any form actions from firing
			event.preventDefault();

			// fetch the form data
			var data = this.fetchFormData();
			
			// send a put request to the server with the updated user information
			$.ajax({
				type: 'PUT',
				url: 'account/user-info',
				data: data,
				success: function( user ) {
					console.log( user );
				}
			})
		},

		fetchFormData: function fetchFormData() {
			// store all the values in the form as an object
			var formData = {
				firstName				: $( '#first-name' ).val(),
				lastName				: $( '#last-name' ).val(),
				email					: $( '#email' ).val(),
				homePhone				: $( '#home-phone' ).val(),
				mobilePhone				: $( '#mobile-phone' ).val(),
				workPhone				: $( '#work-phone' ).val(),
				address1				: $( '#address-1' ).val(),
				address2				: $( '#address-2' ).val(),
				zipCode					: $( '#zip-code' ).val(),
				isMassachusettsResident	: $( '#is-massachusetts-resident' ).is( ':checked' )
			};

			// return an object containing only the fields that are not undefined
			return _.omit( formData, _.isUndefined );
		}
	});
}());
