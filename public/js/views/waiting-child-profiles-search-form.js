(function () {
	'use strict';

	mare.views.GallerySearchForm = Backbone.View.extend({
		// This view controls everything inside the element with class 'gallery-search-form'
		el: '.gallery-search-form',

		events: {

			'click .gallery-search-form__search-button' : 'updateGallery'

		},

		updateGallery: function updateGallery() {

			this.getFormFields();
			this.processFormFields();
			this.removeUneededFilters();
			this.updateChildren();
		},

		getFormFields: function getFormFields() {

			this.formFields = {
				genders							: $('.select-gender:checked'),
				minimumSiblings					: $('#minimum-number-of-siblings').val(),
				maximumSiblings					: $('#maximum-number-of-siblings').val(),
				youngestAge						: $('#youngest-age').val(),
				oldestAge						: $('#oldest-age').val(),
				races							: $('.select-race:checked'),
				primaryLanguage					: $('#primary-language').val(),
				contactWithBiologicalSiblings	: $('.select-contact-with-biological-siblings:checked').val(),
				contactWithBiologicalParents	: $('.select-contact-with-biological-parents:checked').val(),
				videoOnly						: $('.select-video-only:checked').length > 0,
				legallyFreeOnly					: $('.select-legally-free-only:checked').length > 0,
				updatedWithin					: $('#updated-within').val(),
				maximumPhysicalNeeds			: $('.select-maximum-physical-needs:checked').val(),
				maximumEmotionalNeeds			: $('.select-maximum-emotional-needs:checked').val(),
				maximumIntellectualNeeds		: $('.select-maximum-intellectual-needs:checked').val(),
				disabilities					: $('.select-disabilities:checked'),
				otherConsiderations				: $('.select-other-considerations:checked'),
				familyConstellation				: $('.select-family-constellation:checked').val(),
				numberOfChildrenInHome			: $('.select-number-of-children-in-home').val(),
				gendersOfChildrenInHome			: $('.select-genders-of-children-in-home:checked'),
				youngestChildAgeInHome			: $('#youngest-child-age-in-home').val(),
				oldestChildAgeInHome			: $('#oldest-child-age-in-home').val(),
				petsInHome						: $('.select-pets-in-home:checked').length > 0
			};
		},

		processFormFields: function processFormFields() {

			var gendersArray					= [],
				raceArray						= [],
				disabilityArray					= [],
				otherConsiderationsArray		= [],
				gendersOfChildrenInHomeArray	= [],
				formFields						= this.formFields;

			_.each(formFields.genders, function(gender) {
				gendersArray.push(gender.getAttribute('value'));
			});

			_.each(formFields.races, function(race) {
				raceArray.push(race.getAttribute('value'));
			});

			_.each(formFields.disabilities, function(disability) {
				disabilityArray.push(disability.getAttribute('value'));
			});

			_.each(formFields.otherConsiderations, function(consideration) {
				otherConsiderationsArray.push(consideration.getAttribute('value'));
			});

			_.each(formFields.gendersOfChildrenInHome, function(gender) {
				gendersOfChildrenInHomeArray.push(gender.getAttribute('value'));
			});

			formFields.genders					= gendersArray;
			formFields.races					= raceArray;
			formFields.disabilities				= disabilityArray;
			formFields.otherConsiderations		= otherConsiderationsArray;
			formFields.gendersOfChildrenInHome	= gendersOfChildrenInHomeArray;

			formFields.minimumSiblings			= parseInt(formFields.minimumSiblings, 10);
			formFields.maximumSiblings			= parseInt(formFields.maximumSiblings, 10);
			formFields.youngestAge				= parseInt(formFields.youngestAge, 10);
			formFields.oldestAge				= parseInt(formFields.oldestAge, 10);
			formFields.maximumPhysicalNeeds		= formFields.maximumPhysicalNeeds !== undefined ? parseInt(formFields.maximumPhysicalNeeds, 10) : 3;
			formFields.maximumEmotionalNeeds	= formFields.maximumEmotionalNeeds !== undefined ? parseInt(formFields.maximumEmotionalNeeds, 10) : 3;
			formFields.maximumIntellectualNeeds	= formFields.maximumIntellectualNeeds !== undefined ? parseInt(formFields.maximumIntellectualNeeds, 10) : 3;
			formFields.numberOfChildrenInHome	= parseInt(formFields.numberOfChildrenInHome, 10);
			formFields.youngestChildAgeInHome	= parseInt(formFields.youngestChildAgeInHome, 10);
			formFields.oldestChildAgeInHome		= parseInt(formFields.oldestChildAgeInHome, 10);

			formFields.contactWithBiologicalSiblings = formFields.contactWithBiologicalSiblings === 'no' ? false : true; // false : true order is needed, do not change
			formFields.contactWithBiologicalParents = formFields.contactWithBiologicalParents === 'no' ? false : true; // false : true order is needed, do not change
		},

		removeUneededFilters: function removeUneededFilters() {

			var formFields = this.formFields;

			if(formFields.genders.length === 0) { delete formFields.genders; }
			if(formFields.races.length === 0) { delete formFields.races; }
			if(formFields.primaryLanguage === '') { delete formFields.primaryLanguage; }
			if(formFields.contactWithBiologicalSiblings !== false) { delete formFields.contactWithBiologicalSiblings; }
			if(formFields.contactWithBiologicalParents !== false) { delete formFields.contactWithBiologicalParents; }
			if(!formFields.videoOnly) { delete formFields.videoOnly; }
			if(!formFields.legallyFreeOnly) { delete formFields.legallyFreeOnly; }
			if(formFields.updatedWithin === '') { delete formFields.updatedWithin; }
			if(formFields.maximumPhysicalNeeds === 3) { delete formFields.maximumPhysicalNeeds; }
			if(formFields.maximumEmotionalNeeds === 3) { delete formFields.maximumEmotionalNeeds; }
			if(formFields.maximumIntellectualNeeds === 3) { delete formFields.maximumIntellectualNeeds; }
			if(formFields.disabilities.length === 0) { delete formFields.disabilities; }
			if(formFields.otherConsiderations.length === 0) { delete formFields.otherConsiderations; }
			if(!formFields.familyConstellation) { delete formFields.familyConstellation; }
			if(formFields.gendersOfChildrenInHome.length === 0) { delete formFields.gendersOfChildrenInHome; }
			if(!formFields.petsInHome) { delete formFields.petsInHome; }

		},

		updateChildren: function updateChildren() {

			var formFields = this.formFields;

			// Clear out all contents of the current gallery collection
			var model;

			while (model = mare.collections.galleryChildren.first()) {
				model.destroy();
			}

			mare.collections.allChildren.each(function(child) {
				// console.log('child: ', child);
				// break out of the current loop if the child's gender wasn't selected (return is needed for this in _.each)
				if(formFields.genders && formFields.genders.indexOf(child.get('gender')) === -1 ) { return; }
				// break out of the current loop if the child has less than the min or more then the max specified (return is needed for this in _.each)
				if(formFields.minimumSiblings > child.get('siblingContactsCount') ||
				   formFields.maximumSiblings < child.get('siblingContactsCount')) { return; }
				// break out of the current loop if the child's age is less than the youngest or more than the oldest specified (return is needed for this in _.each)
				if(formFields.youngestAge > child.get('age') ||
				   formFields.oldestAge < child.get('age')) { return; }
				// break out of the current loop only if none of the child's races match a selected race (return is needed for this in _.each)
				// <3 Underscore.js for this one
				if(formFields.races && _.intersection(formFields.races, child.get('race')).length === 0) { return; }
				// break out of the current loop only if one of the child's language doesn't match the selected primary language (return is needed for this in _.each)
				if(formFields.primaryLanguage && child.get('language').indexOf(formFields.primaryLanguage) === -1) { return; }
				// break out of the current loop only if the child having contact with their biological siblings/parents doesn't match the user's selection (return is needed for this in _.each)
				if(formFields.contactWithBiologicalSiblings === false &&
				   child.get('hasContactWithBiologicalSiblings') !== false) { return; }

				if(formFields.contactWithBiologicalParents === false &&
				   child.get('hasContactWithBiologicalParents') !== false) { return; }
				// break out of the current loop if the child doesn't have a video and the user specifies that they should (return is needed for this in _.each)
				if(formFields.videoOnly && child.get('hasVideo') === false) { return; }
				// break out of the current loop if the child isn't legally free and the user specifies that they should be (return is needed for this in _.each)
				if(formFields.legallyFreeOnly && child.get('legalStatus') !== 'free') { return; }

				if(formFields.updatedWithin) {
					console.log('updated at:', child.get('updatedAt'));
					console.log(formFields.updatedWithin);
				}

				// break out of the loop if any of the child's needs exceed the maximum specified by the user (return is neede for this in _.each)
				if(formFields.maximumPhysicalNeeds !== undefined && child.get('physicalNeeds') > formFields.maximumPhysicalNeeds) { return; }
				if(formFields.maximumEmotionalNeeds !== undefined && child.get('emotionalNeeds') > formFields.maximumEmotionalNeeds) { return; }
				if(formFields.maximumIntellectualNeeds !== undefined && child.get('intellectualNeeds') > formFields.maximumIntellectualNeeds) { return; }
/************************/
				// break out of the current loop only if none of the child's disabilities match a selected race (return is needed for this in _.each)
				// <3 Underscore.js for this one
				if(formFields.disabilities) {
					console.log('disabilities: ', child.get('disabilities'));
					console.log(formFields.disabilities);
				}
				// if(formFields.disabilities && _.intersection(formFields.disabilities, child.get('disabilities')).length === 0) { return; }

				if(formFields.otherConsiderations) {
					console.log('other considerations: ', child.get('otherConsiderations'));
					console.log(formFields.otherConsiderations);
				}

				if(formFields.familyConstellation) {
					console.log('family constellation: ', child.get('recommendedFamilyConstellation'));
					console.log(formFields.familyConstellation);
				}

				// console.log('considerations: ', child.get('otherFamilyConstellationConsideration'));
				// console.log('form - children in home: ', formFields.numberOfChildrenInHome);
				// console.log('form - youngest: ', formFields.youngestChildAgeInHome);
				// console.log('form - oldest: ', formFields.oldestChildAgeInHome);

				if(formFields.petsInHome) {
					console.log('other considerations', child.get('otherFamilyConstellationConsideration'));
					console.log(formFields.petsInHome);
				}
				// If the child passes all checks, add them to the collection to display on the gallery
				mare.collections.galleryChildren.add(child);

			});

			console.log(mare.collections.galleryChildren);
			mare.collections.galleryChildren.trigger('updateComplete');

		}

	});
}());
