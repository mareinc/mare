(function () {
	'use strict';

	mare.views.AccountInfo = Backbone.View.extend({
		el: '.account-info-container',

		events: {
			'click .save-button'					: 'updateUserInfo',
			'change .social-worker-title-checkbox'	: 'toggleSocialWorkerTitleTextField',
			'submit'								: 'disableSubmitButton'
		},

		initialize: function initialize() {
			// create a hook to access the section templates
			var html 						= $( '#account-info' ).html();
			// compile the templates to be used during rendering/repainting the different sections
			this.template 					= Handlebars.compile( html );
		},

		render: function render() {
			// compile the template
			var html = this.template();
			// render the template to the page
			this.$el.html( html );
		},

		toggleSocialWorkerTitleTextField: function toggleSocialWorkerTitleTextField() {
			// DOM cache any commonly used elements to improve performance
			var 
				$socialWorkerTitle		= this.$( '#social-worker-title' ),
				$socialWorkerTitleGroup	= this.$( '.social-worker-title-group' )
			;

			// Hide/show the hidden 'other' field via the hidden class
			$socialWorkerTitleGroup.toggleClass( 'hidden' );

			if( $socialWorkerTitleGroup.hasClass( 'hidden' ) ) {
				// Clear out the input box since it's hidden and not part of the form submission
				$socialWorkerTitle.val( '' );
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
				url: "account/user-info",
				data: data,
				success: function( user ) {
					console.log( user );
				}
			})
		},

		fetchFormData: function fetchFormData() {
			// fetch all the values stored in the form
			var firstName				= $( '#first-name' ).val(),
				lastName				= $( '#last-name' ).val(),
				email					= $( '#email' ).val(),
				homePhone				= $( '#home-phone' ).val(),
				mobilePhone				= $( '#mobile-phone' ).val(),
				workPhone				= $( '#work-phone' ).val(),
				address1				= $( '#address-1' ).val(),
				address2				= $( '#address-2' ).val(),
				zipCode					= $( '#zip-code' ).val(),
				isMassachusettsResident	= $( '#is-massachusetts-resident' ).is( ':checked' );

			// store the values in an object
			var formData = {
				firstName				: firstName,
				lastName				: lastName,
				email					: email,
				homePhone				: homePhone,
				mobilePhone				: mobilePhone,
				workPhone				: workPhone,
				address1				: address1,
				address2				: address2,
				zipCode					: zipCode,
				isMassachusettsResident	: isMassachusettsResident
			}

			// return an object containing only the fields that are not undefined
			return _.omit( formData, _.isUndefined );
		},

		disableSubmitButton: function disableDonateButton() {
			this.$( '.submit' ).attr( 'disabled', 'disabled' );
		}
	});
}());
