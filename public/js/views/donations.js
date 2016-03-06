(function () {
    'use strict';

    mare.views.Donations = Backbone.View.extend({
        el: 'body',

        events: {
            'click .donate'	: 'donate'
        },

        initialize: function() {
            // set the default donation amount
            this.setDonationAmount(20);
        	// set up all configuration information for binding to the Stripe service
            this.configureCheckout();
            // Set the checkout option using the most up to date configuration (this allows for changing the donation amount)
            this.setCheckout();
        },

        setDonationAmount: function setDonationAmount(amount) {
            // Stripe handles donation amounts in pennies, convert the dollar value
            // TODO: Check for invalid amounts and adjust them in the UI
            this.donationAmount = amount * 100;
        },

        configureCheckout: function configureCheckout() {
            // This is out of scope in the configuration object unless it's stored locally
            var donationAmount = this.donationAmount;
            // Define handler to be called when Stripe returns a card token
            function onReceiveToken(token, args) {
                // Submit token to server so it can charge the card
                $.ajax({
                    url: '/charge',
                    type: 'POST',
                    data: {
                        stripeToken: token.id
                    }
                });
            };

            this.configuration = {
                key: mare.config.STRIPE_TEST_KEY,
                token: onReceiveToken,

                image: 'http://nairteashop.org/wp-content/uploads/avatar.png',
                name: 'adoptions.io',
                description: 'Do it for the children',
                amount: donationAmount,
                billingAddress: 'true'
            };
        },

        setCheckout: function setCheckout() {
            this.checkout = StripeCheckout.configure(this.configuration);
        },

        donate: function donate() {
            this.checkout.open();

            return false;
        },

    });
})();