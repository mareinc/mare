(function () {
	'use strict';

	mare.views.Donations = Backbone.View.extend({

		el: 'body',

		events: {
			'keyup .donations__input-field'		: 'handleOtherDonationAmount',
			'change .donations__input-field'	: 'handleOtherDonationAmount',
			'click .toggle-button'				: 'toggleButton',
			'click #donate-button'				: 'openDonationPopup'
		},

		initialize: function initialize() {

			this.$contentBody					= $( '.content__body' );
			this.$donationDurationButtonGroup	= $( '#donation-duration-button-group' );
			this.$donationAmountButtonGroup		= $( '#donation-amount-button-group' );
			this.$donationAmountInputLabel		= $( '.donations__input-label' );
			this.$donationAmountInputField		= $( '#donation-amount-input' );
			this.$donateButton					= $( '#donate-button' );
			this.$donationHonoreeField			= $( '#donation-in-honor-of-input' );
			this.$donatorNameField				= $( '#donation-name-input' );

			// donation variables
			this.stripeAPIKey					= window.STRIPE_API_KEY;
			this.donationData					= {
				// setter to ensure all donation amounts are normalized for Stripe charges
				setDonationAmount: function setDonationAmount( dollarAmount ) {

					// multiply amount by 100 to convert dollar amounts to pennies
					this.amount = dollarAmount * 100;
				},
				// normalized donation amount ( represented in pennies )
				amount: 0,
				// frequency of the donation in months ( 0 represents a one-time donation )
				// see plan_types in service_donation.js for more details 
				frequency: 0
			};

			// stripe donation popup configuration
			this.StripeHandler = StripeCheckout.configure({
				key: this.stripeAPIKey,
				image: '/images/mare-icon.png',
				locale: 'auto',
				token: this.donationSubmissionHandler()
			});

			// closes StripeHandler on page navigation
			window.addEventListener( 'popstate', function() {

				this.StripeHandler.close();
			});
		},

		// TODO: put this in a global util file since it's duplicated across multiple views
        navigate: function navigate( event ) {
        	window.location.href = $( event.currentTarget ).data( 'url' );
        },

		toggleButton: function toggleButton( event ) {

			var $target			= $( event.currentTarget ),
				$buttonGroup	= $target.closest( '.button-group' );

			this.untoggleButtonGroup( $buttonGroup );

			$target.addClass( 'toggle-button--toggled' );

			if( $buttonGroup.is( '[id=donation-amount-button-group]' ) ) {
				
				//remove $ from button text
				this.donationData.setDonationAmount( Number( $target.data( 'value' ) ) );
				this.clearDonationAmountInput();
			}
			else if( $buttonGroup.is( '[id=donation-duration-button-group]' ) ) {
				
				this.donationData.frequency = $target.data( 'donationInterval' );
			}

			this.checkForRequiredInfo();
		},

		untoggleButtonGroup: function untoggleButtonGroup( $buttonGroup ) {

			$buttonGroup.find( '.toggle-button' ).removeClass( 'toggle-button--toggled' );

		},

		checkForRequiredInfo: function checkForRequiredInfo() {
			// assume that the donation button will be enabled
			var enableDonateButton = true;
			// if no buttons in the duration group were selected, prevent the donation button from being enabled
			if( enableDonateButton &&
			   this.$donationDurationButtonGroup.find( '.toggle-button--toggled' ).length === 0 ) {
				enableDonateButton = false;
			}
			// if no amount button was selected and the amount field is blank or 0, prevent the donation button from being enabled
			if( enableDonateButton &&
			   this.$donationAmountButtonGroup.find( '.toggle-button--toggled' ).length === 0 &&
			   ( this.$donationAmountInputField.val().length === 0 ||
			     this.$donationAmountInputField.val() === '0' ) ) {
				enableDonateButton = false;
			}

			if( enableDonateButton ) {
				this.enableDonateButton();
			} else {
				this.disableDonateButton();
			}

		},

		handleOtherDonationAmount: function handleOtherDonationAmount() {
			// TODO: do we really want to check length vs the number itself?
			// if the donation amount is greater than 0
			if( this.$donationAmountInputField.val().length > 0 ) {
				// get the previous button group and disable all the buttons
				this.untoggleButtonGroup( this.$donationAmountButtonGroup );
				// create an outline to show it's the selection
				this.$donationAmountInputLabel.addClass( 'donations__input-label--selected' );
				this.$donationAmountInputField.addClass( 'donations__input-field--selected' );

				this.donationData.setDonationAmount( Number( this.$donationAmountInputField.val() ) );
			} else {
				// remove the class that adds the outline
				this.$donationAmountInputLabel.removeClass( 'donations__input-label--selected' );
				this.$donationAmountInputField.removeClass( 'donations__input-field--selected' );
			}

			this.checkForRequiredInfo();
		},

		enableDonateButton: function enableDonateButton() {
			$( '#donate-button' ).removeClass( 'button--disabled' );
			$('#donate-button').addClass('donate');
		},

		disableDonateButton: function disableDonateButton() {
			$( '#donate-button' ).addClass( 'button--disabled' );
			$('#donate-button').removeClass('donate');
		},

		clearDonationAmountInput: function clearDonationAmountInput() {
			this.$donationAmountInputField.removeClass( 'donations__input-field--selected' ).val( '' );
			this.$donationAmountInputLabel.removeClass( 'donations__input-label--selected' );
		},

		// opens the stripe donation popup and sets the charge amount to match the current donation amount
		openDonationPopup: function openDonationPopup() {
			
			// if the donation button is not disabled
			if ( !this.$donateButton.hasClass( 'button--disabled' ) ) {
				
				// get donation amount from view-level scope
				var donationAmount = this.donationData.amount; 

				// open the Stripe donation popup
				this.StripeHandler.open({
					name: 'MARE',
					description: 'Thank you for your donation.',
					zipCode: true,
					amount: donationAmount
				});
			}
		},

		// handles the callback from the stripe servers, passes a token to the stripe charge middleware to process the donation
		donationSubmissionHandler: function donationSubmissionHandler() {

			// get donation data from view scope
			var donationData = this.donationData;
			// get donation honoree
			var $donationHonoree = this.$donationHonoreeField;
			// get donators name
			var $donatorName = this.$donatorNameField;
			// get content body
			var $contentBody = this.$contentBody;

			function handleDonation( token ) {

				// create POST body
				var data = {
					// donation amount
					amount: donationData.amount,
					// donation frequency
					frequency: donationData.frequency,
					// donation honoree
					honoree: $donationHonoree.val(),
					// name of donator
					donator: $donatorName.val(),
					// Stripe token
					token: token
				};

				// post the donation to the charge endpoint for payment processing
				$.post( '/process-donation', data, function( responseData ) {

					// handle error responses
					if ( responseData.status === 'error' ) {
						
						// display the error message to the user
						$contentBody.prepend( responseData.message );
						
					// handle success responses
					} else if ( responseData.status === 'success' ) {
						
						// display the success message to the user
						$contentBody.prepend( responseData.message );

					// handle unexpected responses
					} else {

						console.log( 'something went wrong, unhandled response' );
					}
				});
			}

			return handleDonation;
		}
	});
}() );
