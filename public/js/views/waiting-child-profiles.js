(function () {
	'use strict';

	mare.views.WaitingChildProfiles = Backbone.View.extend({
		el: 'body',

		events: {
			'click .media-box'						: 'displayChildDetails',
			'click .modal__close'					: 'closeModal',
			'click .profile-navigation__previous'	: 'displayNextChildDetails',
			'click .profile-navigation__next'		: 'displayNextChildDetails'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$formSelector = $('.registration-type-selector');

			this.initializeMediaBoxes();
		},

		initializeMediaBoxes: function initializeMediaBoxes() {
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
		},

		displayChildDetails: function displayChildDetails(event) {
			var selectedChild = $(event.currentTarget),
	    		registrationNumber = selectedChild.data('registration-number');

	    	this.openModal();
	    	this.getChildData(registrationNumber);
		},

		displayNextChildDetails: function displayNextChildDetails(event) {
			var self = this;

	    	var selectedChild = $(event.currentTarget),
    			registrationNumber = selectedChild.data('registration-number');

	    	$('.modal-container__contents').fadeOut(function() {

	    		self.clearModalContents();

	    		$('.modal-container__loading').fadeIn(function() {
	    			self.getChildData(registrationNumber);
	    		});

	    	});
		},

		openModal: function openModal() {
			$('.modal__background').fadeIn();
			$('.modal-container__contents').hide();
			$('.modal-container__loading').show();
			$('.modal__container').fadeIn();

			mare.utils.disablePageScrolling();
		},

		closeModal: function closeModal() {
			$('.modal__background').fadeOut();
			$('.modal__container').fadeOut();

			mare.utils.enablePageScrolling();

			this.clearModalContents();
		},

		clearModalContents: function clearModalContents() {
			$('.modal-container__contents').html('');
		},

		initializeModalTabs: function initializeModalTabs() {
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
		},

		getChildData: function(registrationNumber) {
			var self = this;
	    	// Submit token to server so it can charge the card
	        $.ajax({
	        	dataType: 'json',
	            url: '/getChildDetails',
	            type: 'POST',
	            data: {
	                registrationNumber: registrationNumber
	            }
	     	}).done(function(childDetails) {
	     		mare.children = mare.children || {};
	     		mare.children.selectedChild = childDetails.registrationNumber;

	     		var selectedChildElement = $('[data-registration-number=' + mare.children.selectedChild + ']');
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

				// self.initializeModalControls();
				self.initializeModalTabs();

	     	});
	    }

	});
})();