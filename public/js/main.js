app.functions = function() {

	storeUrlInfo = function() {
		// Pull the current url information into the app namespace
		app.url.protocol = window.location.protocol;
		app.url.host = window.location.host;
		app.url.pathName =  window.location.pathname.substr(1); // get the pathname without the leading '/'

		// Create convenience member attribute for more intuitive url checking
		app.url.pathArray = app.url.pathName.split( '/' );
		app.url.siteArea = app.url.pathArray[0];
		app.url.page = app.url.pathArray[1];
	};

	bindTouch = function() {
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
	};

	enablePageScrolling = function() {
		$('html, body').removeClass('scrolling-disabled');
	};

	disablePageScrolling = function() {
		$('html, body').addClass('scrolling-disabled');
	};

	initializeModal = function() {
		$('.modal__close').on('click', function() {
	    	app.functions.closeModal();
	    	app.functions.clearModalContents();
	    });
	};

	openModal = function() {
		$('.modal__background').fadeIn();
		$('.modal-container__contents').hide();
		$('.modal-container__loading').show();
		$('.modal__container').fadeIn();

		app.functions.disablePageScrolling();
	};

	closeModal = function() {
		$('.modal__background').fadeOut();
		$('.modal__container').fadeOut();

		app.functions.enablePageScrolling();
	};

	clearModalContents = function() {
		$('.modal-container__contents').html('');
	};

	initializeModalControls = function() {
		$('.profile-navigation__previous, .profile-navigation__next').on('click', function() {
	    	var registrationNumber = $(this).data('registration-number');

	    	$('.modal-container__contents').fadeOut(function() {

	    		app.functions.clearModalContents();

	    		$('.modal-container__loading').fadeIn(function() {
	    			app.functions.getChildData(registrationNumber);
	    		});

	    	});
	    });
	};

	initializeModalTabs = function() {
		$('.profile-tabs__tab').removeClass('profile-tabs__tab--selected');
		$('.profile-tabs__tab').first().addClass('profile-tabs__tab--selected');

		$('.profile-tab__contents').removeClass('profile-tab__contents--selected');
		$('.profile-tab__contents').first().addClass('profile-tab__contents--selected');

		$('.profile-tabs__tab').on('click', function() {
			if($(this).hasClass('profile-tabs__tab--selected')) {
				return;
			}

			var selectedContentType = $(this).data('tab');

			$('.profile-tabs__tab--selected').removeClass('profile-tabs__tab--selected');
			$(this).addClass('profile-tabs__tab--selected');

			$('.profile-tab__contents--selected').removeClass('profile-tab__contents--selected');
			$('[data-contents=' + selectedContentType + ']').addClass('profile-tab__contents--selected');

		});
	};

	initializeSiteMenu = function() {
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
	};

	initializeMobileMenu = function() {
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
	};

	initializeHomePage = function() {
		// initialize the carousel default settings
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
		// TODO: This doesn't seem to be working as well as it needs to.
		$( "#owl-demo img" ).load(function() {
			$(this).siblings('.featured-description').removeClass('hidden');
		});
	};

	initializeRegistrationPage = function() {
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
	};

	initializePhotoListingPage = function() {
		// initialize the photo listing gallery grid
		$('#grid').mediaBoxes({
	        boxesToLoadStart: 12,
	        boxesToLoad: 8,

	        sortContainer: '#sort',
	        sort: 'a',
	        getSortData: {
		        name: '.media-box-name', //When you sort by name, it will only look in the elements with the class "media-box-name"
		        age: '.media-box-age' //When you sort by age, it will only look in the elements with the class "media-box-age"
		        // addedDate: '.media-box-added' //When you sort by date added, it will only look in the elements with the class "media-box-date-added"
		    }
	    });

	    // setup the modal window when a child card is clicked
	    $('.media-box').on('click', function() {
	    	var selectedChild = $(this),
	    		registrationNumber = selectedChild.data('registration-number');

	    	app.functions.openModal();
	    	app.functions.getChildData(registrationNumber);
	    });

	    app.functions.initializeModal();
	};

    getChildData = function(registrationNumber) {
    	// Submit token to server so it can charge the card
        $.ajax({
        	dataType: 'json',
            url: '/getChildDetails',
            type: 'POST',
            data: {
                registrationNumber: registrationNumber
            }
     	}).done(function(childDetails) {
     		app.children = app.children || {};
     		app.children.selectedChild = childDetails.registrationNumber;

     		var selectedChildElement = $('[data-registration-number=' + app.children.selectedChild + ']');
     		var previousChildElement = selectedChildElement.prev();
     		var nextChildElement = selectedChildElement.next();

     		childDetails.previousChildRegistrationNumber = previousChildElement.data('registration-number');
     		childDetails.nextChildRegistrationNumber = nextChildElement.data('registration-number');

     		var source = $("#child-details-template").html();
			var template = Handlebars.compile(source);
			var html = template(childDetails);
			
			$('.modal-container__contents').html(html);

			$('.modal-container__loading').fadeOut(function() {
				$('.modal-container__contents').fadeIn();
			});

			app.functions.initializeModalControls();
			app.functions.initializeModalTabs();

			console.log(childDetails);

     	});
    }

	initializeDonationspage = function() {
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
	};

	return {
		storeUrlInfo				: storeUrlInfo,
		bindTouch					: bindTouch,
		enablePageScrolling			: enablePageScrolling,
		disablePageScrolling		: disablePageScrolling,
		initializeModal				: initializeModal,
		openModal					: openModal,
		closeModal					: closeModal,
		clearModalContents			: clearModalContents,
		initializeModalControls		: initializeModalControls,
		initializeModalTabs			: initializeModalTabs,
		initializeSiteMenu 			: initializeSiteMenu,
		initializeMobileMenu 		: initializeMobileMenu,
		initializeHomePage 			: initializeHomePage,
		initializeRegistrationPage 	: initializeRegistrationPage,
		initializePhotoListingPage 	: initializePhotoListingPage,
		getChildData				: getChildData,
		initializeDonationspage 	: initializeDonationspage
	}
}();

$(function() {
	// basic setup function for every page
	app.functions.bindTouch();
	app.functions.storeUrlInfo();
	app.functions.initializeSiteMenu();
	app.functions.initializeMobileMenu();

	app.router.initializeRouter();
});