(function () {
	'use strict';

	mare.views.AccountInfo = Backbone.View.extend({
		el: '.account-info-container',

		events: {
			'click .save-button'					: 'updateUserInfo',
			'change .social-worker-title-checkbox'	: 'toggleSocialWorkerTitleTextField',
			'change #is-not-MA-city-checkbox'		: 'toggleOutsideMa'
		},

		initialize: function initialize() {
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

		// TODO: Update toggle functionality to make it more solid
		toggleOutsideMa: function toggleOutsideMa( e ) {
			var	$outsideMaToggle = $(e.currentTarget),
				$outsideMaGroup = $('.non-ma-city-container'),
				$outsideMaInput = $(''),
				$outsideMaDropdown = $(''),
				$maGroup = $('.ma-city-container'),
				$maInput = $(''),
				$maDropdown = $('');

				if( $outsideMaToggle.is(':checked') ) {
					$outsideMaGroup.removeClass( 'hidden' );
					$maGroup.addClass( 'hidden' );
				} else {
					$outsideMaGroup.addClass( 'hidden' );
					$maGroup.removeClass( 'hidden' );
				}


			// if( $outsideMaGroup.hasClass('hidden') ) {

			// } else {

			// }		
		},
		
		// TODO: Update toggle functionality to make it more solid
		toggleSocialWorkerTitleTextField: function toggleSocialWorkerTitleTextField() {
			var $socialWorkerTitle		= this.$( '.social-worker-title' ),
				$socialWorkerTitleGroup	= this.$( '.social-worker-title-group' );

			// hide/show the hidden 'other' field via the hidden class
			$socialWorkerTitleGroup.toggleClass( 'hidden' );

			if( $socialWorkerTitleGroup.hasClass( 'hidden' ) ) {
				// store the social worker title to reset the header when the account section is selected again
				this.storedSocialWorkerTitle = $socialWorkerTitle.val();
				// clear out the input box since it's hidden and not part of the form submission
				$socialWorkerTitle.val( '' );
			} else {
				// if the title group isn't hidden, reset the header with the cached title value
				$socialWorkerTitle.val( this.storedSocialWorkerTitle );
				// clear the stored social worker title
				this.storedSocialWorkerTitle = '';
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
				firstName							: document.querySelector( '#first-name' ) ? document.querySelector( '#first-name' ).value : undefined,
				lastName							: document.querySelector( '#last-name' ) ? document.querySelector( '#last-name' ).value : undefined,
				email								: document.querySelector( '#email' ) ? document.querySelector( '#email' ).value : undefined,
				password							: document.querySelector( '#password' ) ? document.querySelector( '#password' ).value : undefined,
				confirmPassword						: document.querySelector( '#confirmPassword' ) ? document.querySelector( '#confirmPassword' ).value : undefined,
				position							: document.querySelector( '#position' ) ? document.querySelector( '#position' ).value : undefined,
				title								: document.querySelector( '#title' ) ? document.querySelector( '#title' ).value : undefined,
				agency								: document.querySelector( '#agency' ) ? document.querySelector( '#agency' ).value : undefined,
				homePhone							: document.querySelector( '#home-phone' ) ? document.querySelector( '#home-phone' ).value : undefined,
				mobilePhone							: document.querySelector( '#mobile-phone' ) ? document.querySelector( '#mobile-phone' ).value : undefined,
				workPhone							: document.querySelector( '#work-phone' ) ? document.querySelector( '#work-phone' ).value : undefined,
				preferredPhone						: document.querySelector( '#preferred-phone' ) ? document.querySelector( '#preferred-phone' ).value : undefined,
				street1								: document.querySelector( '#address-1' ) ? document.querySelector( '#address-1' ).value : undefined,
				street2								: document.querySelector( '#address-2' ) ? document.querySelector( '#address-2' ).value : undefined,
				zipCode								: document.querySelector( '#zip-code' ) ? document.querySelector( '#zip-code' ).value : undefined,
				maCity								: document.querySelector( '#ma-city' ) ? document.querySelector( '#ma-city' ).value : undefined,
				nonMaCity							: document.querySelector( '#non-ma-city' ) ? document.querySelector( '#non-ma-city' ).value : undefined,
				isOutsideMassachusetts				: document.querySelector( '#is-not-MA-city-checkbox' ) ? document.querySelector( '#is-not-MA-city-checkbox' ).checked : undefined
			};

			// Family
			if ( document.querySelector( '#contact1-first-name' ) ) {
				formData.contact1 = {
					firstName						: document.querySelector( '#contact1-first-name' ),
					lastName						: document.querySelector( '#contact1-last-name' ),
					email							: document.querySelector( '#contact1-email' ),
					mobile							: document.querySelector( '#contact1-mobile' ),
					preferredCommunicationMethod	: document.querySelector( '#contact1-preferred-communication-method' ),
					gender							: document.querySelector( '#contact1-gender-error-container' ),
					race							: document.querySelector( '#contact1-race-error-container' ),
					occupation						: document.querySelector( '#contact1-occupation' )
				}
			}

			// return an object containing only the fields that are not undefined
			return _.omit( formData, _.isUndefined );
		}
	});
}());
