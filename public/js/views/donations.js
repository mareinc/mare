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

			this.$donationDurationButtonGroup	= $( '#donation-duration-button-group' );
			this.$donationAmountButtonGroup		= $( '#donation-amount-button-group' );
			this.$donationAmountInputLabel		= $( '.donations__input-label' );
			this.$donationAmountInputField		= $( '#donation-amount-input' );
			this.$donateButton					= $( '#donate-button' );

			// donation variables
			this._donationAmount 				= 0;
			this.stripeAPIKey					= window.STRIPE_API_KEY;

			// stripe donation popup configuration
			this.StripeHandler = StripeCheckout.configure({

				key: this.stripeAPIKey,
				image: '/images/mare-icon.png',
				locale: 'auto',
				token: this.donationSubmissionHandler
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
				this._donationAmount = Number($target.data('value'));
				this.clearDonationAmountInput();
			}
			else if($buttonGroup.is('[id=donation-duration-button-group]')){
				this._donationFreq = $target.text();
			}

			this.checkForRequiredInfo();
		},

		untoggleButtonGroup: function untoggleButtonGroup( $buttonGroup ) {

			$buttonGroup.find( '.toggle-button' ).removeClass( 'toggle-button--toggled' );

		},

		checkForRequiredInfo: function checkForRequiredInfo() {

			var enableDonateButton = true;

			if( enableDonateButton &&
			   this.$donationDurationButtonGroup.find( '.toggle-button--toggled' ).length === 0 ) {
				enableDonateButton = false;
			}

			if( enableDonateButton &&
			   this.$donationAmountButtonGroup.find( '.toggle-button--toggled' ).length === 0 &&
			   this.$donationAmountInputField.val().length === 0 ) {
				enableDonateButton = false;
			}

			if( enableDonateButton) {
				this.enableDonateButton();
			} else {
				this.disableDonateButton();
			}

		},

		handleOtherDonationAmount: function handleOtherDonationAmount() {
			// TODO: do we really want to check length vs the number itself?
			// if the donation amount is great than 0
			if( this.$donationAmountInputField.val().length > 0) {
				// get the previous button group and disable all the buttons
				this.untoggleButtonGroup( this.$donationAmountButtonGroup );
				// create an outline to show it's the selection
				this.$donationAmountInputLabel.addClass( 'donations__input-label--selected' );
				this.$donationAmountInputField.addClass( 'donations__input-field--selected' );

				this._donationAmount = Number(this.$donationAmountInputField.val());
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

			// @Jared Question: how do you want to handle the donation button behavior if the donation amount is 0?
			// @Jared Question: the donate button still has a hover state even when it is disabled - is that desired?

			// if the donation button is not disabled
			if ( !this.$donateButton.hasClass( 'button--disabled' ) ) {

				// convert the donation amount from dollars ( $1.00 ) to pennies ( 100 )
				var donationAmount = this._donationAmount * 100; 

				this.StripeHandler.open({
					name: 'MARE',
					description: 'Donation Description',
					zipCode: true,
					amount: donationAmount
				});
			}
		},

		// handles the callback from the stripe servers, passes a token to the stripe charge middleware to process the donation
		donationSubmissionHandler: function donationSubmissionHandler( token ) {

			console.log( token );
		}
	});
}() );
