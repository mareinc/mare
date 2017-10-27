// TODO: remove the complexity in this file by breaking out testing and storing of variables into discrete functions, then update .eslintrc

(function () {
	'use strict';

	mare.views.GallerySearchForm = Backbone.View.extend({
		// this view controls everything inside the element with class 'gallery-search-form'
		el: '.gallery-search-form',

		events: {

			'click .gallery-search-form__search-button' : 'updateGallery'

		},

		updateGallery: function updateGallery() {

			this.getFormFields();
			this.processFormFields();
			this.removeUneededFilters();
			this.updateChildren();
			this.updateSiblingGroups();
			// emit an event to allow the gallery to update it's display now that we have all matching models
			mare.collections.galleryChildren.trigger( 'updateComplete' );
		},

		getFormFields: function getFormFields() {

			this.formFields = {
				genders							: $( '.select-gender:checked' ),
				minimumChildren					: $( '#minimum-number-of-children' ).val(),
				maximumChildren					: $( '#maximum-number-of-children' ).val(),
				youngestAge						: $( '#youngest-age' ).val(),
				oldestAge						: $( '#oldest-age' ).val(),
				races							: $( '.select-race:checked' ),
				primaryLanguages				: $( '.select-primary-language:checked' ),
				showSiblingGroups				: $( '.select-show-sibling-groups:checked' ),
				contactWithBiologicalSiblings	: $( '.select-contact-with-biological-siblings:checked' ).val(),
				contactWithBiologicalParents	: $( '.select-contact-with-biological-parents:checked' ).val(),
				videoOnly						: $( '.select-video-only:checked' ).length > 0,
				legallyFreeOnly					: $( '.select-legally-free-only:checked' ).length > 0,
				updatedWithin					: $( '#updated-within' ).val(),
				maximumPhysicalNeeds			: $( '.select-maximum-physical-needs:checked' ).val(),
				maximumEmotionalNeeds			: $( '.select-maximum-emotional-needs:checked' ).val(),
				maximumIntellectualNeeds		: $( '.select-maximum-intellectual-needs:checked' ).val(),
				disabilities					: $( '.select-disabilities:checked' ),
				familyConstellation				: $( '.select-family-constellation:checked' ).val(),
				numberOfChildrenInHome			: $( '.select-number-of-children-in-home' ).val(),
				gendersOfChildrenInHome			: $( '.select-genders-of-children-in-home:checked' ),
				youngestChildAgeInHome			: $( '#youngest-child-age-in-home' ).val(),
				oldestChildAgeInHome			: $( '#oldest-child-age-in-home' ).val(),
				petsInHome						: $( '.select-pets-in-home:checked' ).length > 0
			};
		},

		processFormFields: function processFormFields() {

			var gendersArray					= [],
				raceArray						= [],
				primaryLanguagesArray			= [],
				disabilityArray					= [],
				gendersOfChildrenInHomeArray	= [],
				formFields						= this.formFields;

			_.each(  formFields.genders, function( gender ) {
				gendersArray.push( gender.getAttribute( 'value' ) );
			});

			_.each( formFields.races, function( race ) {
				raceArray.push( race.getAttribute( 'value' ) );
			});

			_.each( formFields.primaryLanguages, function( language ) {
				primaryLanguagesArray.push( language.getAttribute( 'value' ) );
			});

			_.each( formFields.disabilities, function( disability ) {
				disabilityArray.push( disability.getAttribute( 'value' ) );
			});

			_.each( formFields.gendersOfChildrenInHome, function( gender ) {
				gendersOfChildrenInHomeArray.push( gender.getAttribute( 'value' ) );
			});

			formFields.genders					= gendersArray;
			formFields.races					= raceArray;
			formFields.primaryLanguages			= primaryLanguagesArray;
			formFields.disabilities				= disabilityArray;
			formFields.gendersOfChildrenInHome	= gendersOfChildrenInHomeArray;

			formFields.minimumChildren			= parseInt( formFields.minimumChildren, 10 );
			formFields.maximumChildren			= parseInt( formFields.maximumChildren, 10 );
			formFields.youngestAge				= parseInt( formFields.youngestAge, 10 );
			formFields.oldestAge				= parseInt( formFields.oldestAge, 10 );
			formFields.maximumPhysicalNeeds		= formFields.maximumPhysicalNeeds !== undefined ? parseInt( formFields.maximumPhysicalNeeds, 10 ) : 3;
			formFields.maximumEmotionalNeeds	= formFields.maximumEmotionalNeeds !== undefined ? parseInt( formFields.maximumEmotionalNeeds, 10 ) : 3;
			formFields.maximumIntellectualNeeds	= formFields.maximumIntellectualNeeds !== undefined ? parseInt( formFields.maximumIntellectualNeeds, 10 ) : 3;
			formFields.numberOfChildrenInHome	= parseInt( formFields.numberOfChildrenInHome, 10 );
			formFields.youngestChildAgeInHome	= parseInt( formFields.youngestChildAgeInHome, 10 );
			formFields.oldestChildAgeInHome		= parseInt( formFields.oldestChildAgeInHome, 10 );

			formFields.showSiblingGroups				= formFields.showSiblingGroups === 'no' ? false : true; // false : true order is needed, do not change
			formFields.contactWithBiologicalSiblings	= formFields.contactWithBiologicalSiblings === 'no' ? false : true; // false : true order is needed, do not change
			formFields.contactWithBiologicalParents		= formFields.contactWithBiologicalParents === 'no' ? false : true; // false : true order is needed, do not change
		},

		removeUneededFilters: function removeUneededFilters() {

			var formFields = this.formFields;

			if( formFields.genders.length === 0 )						{ delete formFields.genders; }
			if( formFields.races.length === 0 )							{ delete formFields.races; }
			if( formFields.primaryLanguages.length === 0 )				{ delete formFields.primaryLanguages }
			if( formFields.showSiblingGroups !== false )				{ delete formFields.showSiblingGroups }
			if( formFields.contactWithBiologicalSiblings !== false )	{ delete formFields.contactWithBiologicalSiblings; }
			if( formFields.contactWithBiologicalParents !== false )		{ delete formFields.contactWithBiologicalParents; }
			if( !formFields.videoOnly )									{ delete formFields.videoOnly; }
			if( !formFields.legallyFreeOnly )							{ delete formFields.legallyFreeOnly; }
			if( formFields.updatedWithin === '' )						{ delete formFields.updatedWithin; }
			if( formFields.maximumPhysicalNeeds === 3 )					{ delete formFields.maximumPhysicalNeeds; }
			if( formFields.maximumEmotionalNeeds === 3 )				{ delete formFields.maximumEmotionalNeeds; }
			if( formFields.maximumIntellectualNeeds === 3 )				{ delete formFields.maximumIntellectualNeeds; }
			if( formFields.disabilities.length === 0 )					{ delete formFields.disabilities; }
			if( formFields.gendersOfChildrenInHome.length === 0 )		{ delete formFields.gendersOfChildrenInHome; }
			if( !formFields.petsInHome )								{ delete formFields.petsInHome; }
		},

		updateChildren: function updateChildren() {

			var formFields = this.formFields;

			// clear out all contents of the current gallery collection
			mare.collections.galleryChildren.reset();

			mare.collections.allChildren.each( function( child ) {

				// break out of the current loop if the child's gender wasn't selected ( return is needed for this in _.each )
				if( formFields.genders && formFields.genders.indexOf( child.get( 'gender' ) ) === -1 ) { return; }

				// break out of the current loop if the child's age is less than the youngest or more than the oldest specified ( return is needed for this in _.each )
				if( formFields.youngestAge > child.get( 'age' ) ||
				   formFields.oldestAge < child.get( 'age' ) ) { return; }

				// break out of the current loop only if none of the child's races match a selected race ( return is needed for this in _.each )
				// <3 Underscore.js for this one
				if( formFields.races && _.intersection( formFields.races, child.get( 'race' )).length === 0 ) { return; }

				// break out of the current loop only if none of the child's languages match a selected primary language ( return is needed for this in _.each )
				// <3 Underscore.js for this one
				if( formFields.primaryLanguages && _.intersection( formFields.primaryLanguages, child.get( 'language' )).length === 0 ) { return; }

				// break out of the current loop only if the child having contact with their biological siblings/parents doesn't match the user's selection ( return is needed for this in _.each )
				if( formFields.contactWithBiologicalSiblings === false &&
				   child.get( 'hasContactWithBiologicalSiblings' ) !== false ) { return; }

				if( formFields.contactWithBiologicalParents === false &&
				   child.get( 'hasContactWithBiologicalParents' ) !== false ) { return; }

				// break out of the current loop if the child doesn't have a video and the user specifies that they should ( return is needed for this in _.each )
				if( formFields.videoOnly && child.get( 'hasVideo' ) === false ) { return; }

				// break out of the current loop if the child isn't legally free and the user specifies that they should be ( return is needed for this in _.each )
				if( formFields.legallyFreeOnly && child.get( 'legalStatus' ) !== 'free' ) { return; }

				// only consider when the child was updated if a selection was made in the search criteria
				if( formFields.updatedWithin ) {
					var lastUpdated			= new Date( child.get( 'updatedAt' ) ),
						restriction			= new Date( formFields.updatedWithin ),
						currentMilliseconds	= new Date().getTime(),
						cutoffMilliseconds	= parseInt( formFields.updatedWithin, 10 ),
						cutoffDate			= new Date( currentMilliseconds - cutoffMilliseconds ),
						isIncluded			= lastUpdated >= cutoffDate;

					// break out of the current loop if the child wasn't updated within the timeframe specified by the user ( return is needed for this in _.each )
					if( !isIncluded ) { return; }
				}
				// TODO: are these !== undefined checks necessary?
				// break out of the loop if any of the child's needs exceed the maximum specified by the user ( return is needed for this in _.each )
				if( formFields.maximumPhysicalNeeds !== undefined && child.get( 'physicalNeeds' ) > formFields.maximumPhysicalNeeds ) { return; }
				if( formFields.maximumEmotionalNeeds !== undefined && child.get( 'emotionalNeeds' ) > formFields.maximumEmotionalNeeds ) { return; }
				if( formFields.maximumIntellectualNeeds !== undefined && child.get( 'intellectualNeeds' ) > formFields.maximumIntellectualNeeds ) { return; }

				// break out of the current loop only if the child has disabilities and none match a selected disability ( return is needed for this in _.each )
				if( formFields.disabilities &&
					child.get( 'disabilities' ).length > 0 &&
				   _.intersection( formFields.disabilities, child.get( 'disabilities' ) ).length === 0 ) { return; }

				// break out of the loop if the recommended family constellation for the child does not contain the one selected by the user
				if( formFields.familyConstellation &&
					child.get( 'recommendedFamilyConstellation' ).length > 0 &&
					child.get( 'recommendedFamilyConstellation' ).indexOf( formFields.familyConstellation ) === -1 ) { return; }
				
				// determine if selections were made about the family, if not, don't use it to restrict search results
				var numberOfChildrenInHomeSelected	= formFields.numberOfChildrenInHome !== '',
					oldestChildAgeInHomeSelected	= formFields.oldestChildAgeInHome !== '',
					youngestChildAgeInHomeSelected	= formFields.youngestChildAgeInHome !== '';
				// store references to other family constellatoin considerations listed for any of the siblings
				var requiresSiblings			= child.get( 'requiresSiblings' ),
					requiresNoSiblings			= child.get( 'requiresNoSiblings' ),
					olderChildrenAcceptable		= child.get( 'olderChildrenAcceptable' ),
					youngerChildrenAcceptable	= child.get( 'youngerChildrenAcceptable' ),
					// keep track of whether there are no other family constellation considerations listed for the child
					hasOtherFamilyConstellationConsiderations = requiresSiblings
															|| requiresNoSiblings
															|| youngerChildrenAcceptable
															|| olderChildrenAcceptable;
				// assume that the family doesn't match with the child
				var otherFamilyConstellationConsiderationsMatch = false;
				/* NOTE: this logic is meant to be inclusive, so any matches on the child will add them to the search results */
				// if the child has no listed other family constellation considerations, they should be included in the search results
				if( !hasOtherFamilyConstellationConsiderations ) {
					otherFamilyConstellationConsiderationsMatch = true;
				// otherwise, if other family constellation considerations are listed for one or more sibling
				} else {
					// if the child requires siblings and the family has children, they should be included in the search results
					if( requiresSiblings ) {
						if( numberOfChildrenInHomeSelected && formFields.numberOfChildrenInHome !== 0 ) {
							otherFamilyConstellationConsiderationsMatch = true;
						}
					}
					// if the child requires no siblings and the family has no children, they should be included in the search results
					if( requiresNoSiblings ) {
						if( numberOfChildrenInHomeSelected && formFields.numberOfChildrenInHome === 0 ) {
							otherFamilyConstellationConsiderationsMatch = true;
						}
					}
					// if the child accepts older children and the family has older children, they should be included in the search results
					if( olderChildrenAcceptable ) {
						if( oldestChildAgeInHomeSelected && formFields.oldestChildAgeInHome >= child.get( 'age' ) ) {
							otherFamilyConstellationConsiderationsMatch = true;
						}
					}
					// if the child accepts younger children and the family has younger children, they should be included in the search results
					if( youngerChildrenAcceptable ) {
						if( youngestChildAgeInHomeSelected && formFields.youngestChildAgeInHome <= child.get( 'age' ) ) {
							otherFamilyConstellationConsiderationsMatch = true;
						}
					}
				}
				// break out of the loop if none of the other considerations selected match the sibling group ( return is needed for this in _.each )
				if( !otherFamilyConstellationConsiderationsMatch ) { return; }
				// if the child requires no pets and the family has pets, they should be be excluded from the search results
				if( formFields.petsInHome && child.get( 'noPets' ) ) { return; }
				// if the child passes all checks, add them to the collection to display on the gallery
				mare.collections.galleryChildren.add( child );
			});
		},

		updateSiblingGroups: function updateSiblingGroups() {

			var formFields = this.formFields;

			// clear out all contents of the current gallery collection
			mare.collections.gallerySiblingGroups.reset();

			mare.collections.allSiblingGroups.each( function( siblingGroup ) {
				// break out of the current loop if the sibling group's gender wasn't selected ( return is needed for this in _.each )
				if( formFields.genders && _.difference( siblingGroup.get( 'genders' ), formFields.genders ).length > 0 ) { return; }

				// break out of the current loop if the sibling group has less than the min or more then the max specified ( return is needed for this in _.each )
				if( formFields.minimumChildren > siblingGroup.get( 'siblingToBePlacedWithCount' ) + 1 ||
					formFields.maximumChildren < siblingGroup.get( 'siblingToBePlacedWithCount' ) + 1 ) { return; }

				// break out of the current loop if the sibling group's age is less than the youngest or more than the oldest specified ( return is needed for this in _.each )
				if( formFields.youngestAge > _.max( siblingGroup.get( 'ages' ) ) ||
					formFields.oldestAge < _.min( siblingGroup.get( 'ages' ) ) ) { return; }

				// break out of the current loop only if none of the sibling group's races match a selected race ( return is needed for this in _.each )
				// <3 Underscore.js for this one
				if( formFields.races && _.difference( siblingGroup.get( 'races' ), formFields.races ).length > 0 ) { return; }

				// break out of the current loop only if none of the sibling group's languages match a selected primary language ( return is needed for this in _.each )
				// <3 Underscore.js for this one
				// TODO: Check with Lisa, this may have to change, currently if any language matches a selected one, it will include the sibling group
				if( formFields.primaryLanguages && _.intersection( formFields.primaryLanguages, siblingGroup.get( 'languages' ) ).length === 0 ) { return; }

				// break out of the current loop only if the sibling group being part of a sibling group doesn't match the user's selection ( return is needed for this in _.each )
				if( formFields.showSiblingGroups === false ) { return; }

				// TODO: some of these fields below don't need to remain as an array, and can be cleaned up if the data is processed into a single value before sending it to the browser

				// break out of the current loop only if the sibling group having contact with their biological siblings/parents doesn't match the user's selection ( return is needed for this in _.each )
				if( formFields.contactWithBiologicalSiblings === false &&
					siblingGroup.get( 'hasContactWithBiologicalSiblings' ).indexOf( true ) !== -1 ) { return; }

				if( formFields.contactWithBiologicalParents === false &&
					siblingGroup.get( 'hasContactWithBiologicalParents' ).indexOf( true ) !== -1 ) { return; }

				// break out of the current loop if the sibling group doesn't have a video and the user specifies that they should ( return is needed for this in _.each )
				if( formFields.videoOnly && siblingGroup.get( 'hasVideo' ).indexOf( false ) !== -1 ) { return; }

				// break out of the current loop if the sibling group isn't legally free and the user specifies that they should be ( return is needed for this in _.each )
				if( formFields.legallyFreeOnly && siblingGroup.get( 'legalStatuses' ).indexOf( 'legal risk' ) !== -1 ) { return; }

				// only consider when the sibling group was updated if a selection was made in the search criteria
				if( formFields.updatedWithin ) {
					var lastUpdated			= new Date( _.max( siblingGroup.get( 'updatedAt' ) ) ),
						restriction			= new Date( formFields.updatedWithin ),
						currentMilliseconds	= new Date().getTime(),
						cutoffMilliseconds	= parseInt( formFields.updatedWithin, 10 ),
						cutoffDate			= new Date( currentMilliseconds - cutoffMilliseconds ),
						isIncluded			= lastUpdated >= cutoffDate;

					// break out of the current loop if the sibling group wasn't updated within the timeframe specified by the user ( return is needed for this in _.each )
					if( !isIncluded ) { return; }
				}
				// TODO: are these !== undefined checks necessary?
				// break out of the loop if any of the sibling group's needs exceed the maximum specified by the user ( return is needed for this in _.each )
				if( formFields.maximumPhysicalNeeds !== undefined && _.max( siblingGroup.get( 'physicalNeeds' ) ) > formFields.maximumPhysicalNeeds ) { return; }
				if( formFields.maximumEmotionalNeeds !== undefined && _.max( siblingGroup.get( 'emotionalNeeds' ) ) > formFields.maximumEmotionalNeeds ) { return; }
				if( formFields.maximumIntellectualNeeds !== undefined && _.max( siblingGroup.get( 'intellectualNeeds' ) ) > formFields.maximumIntellectualNeeds ) { return; }

				// break out of the current loop only if the sibling group has disabilities and none match a selected disability ( return is needed for this in _.each )
				if( formFields.disabilities &&
					siblingGroup.get( 'disabilities' ).length > 0 &&
					_.difference( siblingGroup.get( 'disabilities' ), formFields.disabilities ).length > 0 ) { return; }

				// break out of the loop if the recommended family constellation for the sibling group does not contain the one selected by the user				
				if( formFields.familyConstellation &&
					siblingGroup.get( 'recommendedFamilyConstellations' ).length > 0 &&
					siblingGroup.get( 'recommendedFamilyConstellations' ).indexOf( formFields.familyConstellation ) === -1 ) { return; }
				// determine if selections were made about the family, if not, don't use it to restrict search results
				var numberOfChildrenInHomeSelected	= formFields.numberOfChildrenInHome !== '',
					oldestChildAgeInHomeSelected	= formFields.oldestChildAgeInHome !== '',
					youngestChildAgeInHomeSelected	= formFields.youngestChildAgeInHome !== '';
				// store references to other family constellatoin considerations listed for any of the siblings
				var requiresSiblings			= siblingGroup.get( 'requiresSiblings' ).indexOf( true ) !== -1,
					requiresNoSiblings			= siblingGroup.get( 'requiresNoSiblings' ).indexOf( true ) !== -1,
					olderChildrenAcceptable		= siblingGroup.get( 'olderChildrenAcceptable' ).indexOf( true ) !== -1,
					youngerChildrenAcceptable	= siblingGroup.get( 'youngerChildrenAcceptable' ).indexOf( true ) !== -1,
					// keep track of whether there are no other family constellation considerations listed for any of the siblings
					hasOtherFamilyConstellationConsiderations = requiresSiblings
															 || requiresNoSiblings
															 || youngerChildrenAcceptable
															 || olderChildrenAcceptable;
				// assume that the family doesn't match with the sibling group
				var otherFamilyConstellationConsiderationsMatch = false;
				/* NOTE: this logic is meant to be inclusive, so any matches on any of the siblings needs will add them to the search results */
				// if no siblings have listed other family constellation considerations, they should be included in the search results
				if( !hasOtherFamilyConstellationConsiderations ) {
					otherFamilyConstellationConsiderationsMatch = true;
				// otherwise, if other family constellation considerations are listed for one or more sibling
				} else {
					// if any siblings require siblings and the family has children, they should be included in the search results
					if( requiresSiblings ) {
						if( numberOfChildrenInHomeSelected && formFields.numberOfChildrenInHome !== 0 ) {
							otherFamilyConstellationConsiderationsMatch = true;
						}
					}
					// if any siblings require no siblings and the family has no children, they should be included in the search results
					if( requiresNoSiblings ) {
						if( numberOfChildrenInHomeSelected && formFields.numberOfChildrenInHome === 0 ) {
							otherFamilyConstellationConsiderationsMatch = true;
						}
					}
					// if any siblings accept older children and the family has older children, they should be included in the search results
					if( olderChildrenAcceptable ) {
						if( oldestChildAgeInHomeSelected && formFields.oldestChildAgeInHome >= _.max( siblingGroup.get( 'age' ) ) ) {
							otherFamilyConstellationConsiderationsMatch = true;
						}
					}
					// if any siblings accept younger children and the family has younger children, they should be included in the search results
					if( youngerChildrenAcceptable ) {
						if( youngestChildAgeInHomeSelected && formFields.youngestChildAgeInHome <= _.min( siblingGroup.get( 'age' ) ) ) {
							otherFamilyConstellationConsiderationsMatch = true;
						}
					}
				}
				// if any siblings require no pets and the family has pets, they should be excluded from the search results
				if( formFields.petsInHome && siblingGroup.get( 'noPets' ).indexOf( true ) !== -1 ) { return; }
				// break out of the loop if none of the other considerations selected match the sibling group ( return is needed for this in _.each )
				if( !otherFamilyConstellationConsiderationsMatch ) { return; }
				// if the sibling group passes all checks, add them to the collection to display on the gallery
				mare.collections.gallerySiblingGroups.add( siblingGroup );
			});
		}
	});
}() );
