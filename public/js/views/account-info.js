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
				firstName							: $( '#first-name' ) ? $( '#first-name' ).val() : undefined,
				lastName							: $( '#last-name' ) ? $( '#last-name' ).val() : undefined,
				email								: $( '#email' ) ? $( '#email' ).val() : undefined,
				password							: $( '#password' ) ? $( '#password' ).val() : undefined,
				confirmPassword						: $( '#confirmPassword' ) ? $( '#confirmPassword' ).val() : undefined,
				position							: $( '#position' ) ? $( '#position' ).val() : undefined,
				title								: $( '#title' ) ? $( '#title' ).val() : undefined,
				agency								: $( '#agency' ) ? $( '#agency' ).val() : undefined,
				homePhone							: $( '#home-phone' ) ? $( '#home-phone' ).val() : undefined,
				mobilePhone							: $( '#mobile-phone' ) ? $( '#mobile-phone' ).val() : undefined,
				workPhone							: $( '#work-phone' ) ? $( '#work-phone' ).val() : undefined,
				preferredPhone						: $( '#preferred-phone' ) ? $( '#preferred-phone' ).val() : undefined,
				street1								: $( '#address-1' ) ? $( '#address-1' ).val() : undefined,
				street2								: $( '#address-2' ) ? $( '#address-2' ).val() : undefined,
				zipCode								: $( '#zip-code' ) ? $( '#zip-code' ).val() : undefined,
				maCity								: $( '#ma-city' ) ? $( '#ma-city' ).val() : undefined,
				nonMaCity							: $( '#non-ma-city' ) ? $( '#non-ma-city' ).val() : undefined,
				isOutsideMassachusetts				: $( '#is-not-MA-city-checkbox' ) ? $( '#is-not-MA-city-checkbox' ).is( ':checked' ) : undefined,

				// Family
				contact1: {
					firstName						: $( 'contact1-first-name' ),
					lastName						: $( 'contact1-last-name' ),
					email							: $( 'contact1-email' ),
					mobile							: $( 'contact1-mobile' ),
					preferredCommunicationMethod	: $( 'contact1-preferred-communication-method' ),
					gender							: $( 'contact1-gender-error-container' ),
					race							: $( 'contact1-race-error-container' ),
					occupation						: $( 'contact1-occupation' )
				}
			};

			// return an object containing only the fields that are not undefined
			return _.omit( formData, _.isUndefined );
		}
	});
}());
