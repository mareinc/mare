$(function() {
		// 'use strict';

		// app.Routes.router = new app.Routes.Router();
		// Backbone.history.start();
});

$(document).ready(function() {

	// Bind adding of 'hover' class to tap vs hover depending on whether it is a touch enabled device
	if (Modernizr.touch) {
		$(".nav li").unbind('mouseenter mouseleave');
		$(".nav li a.parent").unbind('click');
		$(".nav li .more").unbind('click').bind('click', function() {     
			$(this).parent("li").toggleClass("hover");
		});

	} else {
		$(".nav li").removeClass("hover");
		$(".nav li a").unbind('click');
		$(".nav li").unbind('mouseenter mouseleave').bind('mouseenter mouseleave', function() {
			// must be attached to li so that mouseleave is not triggered when hovering over a submenu
			$(this).toggleClass('hover');
		});
	}
 
	// initialize the carousel on the home page
	$("#owl-demo").owlCarousel({
		autoPlay : 3000,
		stopOnHover: true,
		singleItem : true,
		lazyLoad : true,
		lazyEffect: 'fade',
		autoHeight: true,
		transitionStyle : 'fade'
	});

	// prevents the carousel image descriptions from loading in before the images do
	$( "#owl-demo img" ).load(function() {
		$(this).siblings('.featured-description').removeClass('hidden');
	});

	// initialize the mobile menu attached to the hamburger icon
	$("#mobile-menu").mmenu({
			 "extensions": [
					"border-full",
					"effect-slide-menu",
					"effect-slide-panels-0",
					"pageshadow",
					"theme-dark"
			 ],
			 "offCanvas": {
					"position": "right"
			 },
			 "counters": true,
			 "navbars": [
					{
						 "position": "top",
						 "content": [
								"prev",
								"title",
								"close"
						 ]
					},
					{
						 "position": "bottom",
						 "content": [
								"<a class='fa fa-envelope' href='#/'></a>",
								"<a class='fa fa-twitter' href='#/'></a>",
								"<a class='fa fa-facebook' href='#/'></a>"
						 ]
					}
			 ]
		});


	// allows the mobile menu to be seen (it was hidden to prevent it flashing on the screen during page load)
	$('#mobile-menu').removeClass('hidden');

	// initialize the log-in menu
	$('.log-in-link').click(function() {
		$('.log-in-container').toggle();
	});

	/* TODO: This is a hacky mess, change the top nav for better markup and JavaScript */
	$('.log-in-container').click(function(e) {
		e.stopPropagation();
	});

	/* check for dropdown menu selection on registration page to show the correct form */
	/* TODO: consider adding a class to the 'active' form, hide that with a fadeOut(), then fadeIn() the selected form. */
	$('.registration-type-selector').change(function() {
		var siteForm = $('.site-visitor-registration'),
			socialWorkerForm = $('.social-worker-registration'),
			prospectiveParentForm = $('.prospective-parent-registration'),
			currentValue = $(this).val();

		switch(currentValue) {
			case 'siteVisitor': socialWorkerForm.hide(); prospectiveParentForm.hide(); siteForm.show(); break;
			case 'socialWorker': siteForm.hide(); prospectiveParentForm.hide(); socialWorkerForm.show(); break;
			case 'prospectiveParent': siteForm.hide(); socialWorkerForm.hide(); prospectiveParentForm.show(); break;
		}
	});

	// initialize the photo listing gallery grid
	$('#grid').mediaBoxes({
        boxesToLoadStart: 12,
        boxesToLoad: 8,
    }); 

	/* initialize Stripe donations */

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

	// Configure Checkout
    var checkout = StripeCheckout.configure({
        key: app.config.STRIPE_TEST_KEY,
        token: onReceiveToken,

        image: 'http://nairteashop.org/wp-content/uploads/avatar.png',
        name: 'adoptions.io',
        description: 'Do it for the children',
        amount: 1000,
        billingAddress: 'true'
    });

    // Open Checkout when the link is clicked
	$('.donate').on('click', function() {
        checkout.open();
        return false;
    });
});