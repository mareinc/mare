var keystone		= require('keystone'),
	_				= require('underscore'),
	async			= require('async'),
	middleware		= require('./middleware'),
	Child			= keystone.list('Child');
	familyService	= require('./service_family'),
// TODO: combine the below two functions, the only difference in the filter in the find()
exports.getAllChildren = ( req, res, done ) => {

	let locals = res.locals;

	Child.model.find()
				.populate( 'gender' )
				.populate( 'race' )
				.populate( 'language' )
				.populate( 'disabilities' )
				.populate( 'otherConsiderations' )
				.populate( 'recommendedFamilyConstellation' )
				.populate( 'otherFamilyConstellationConsideration' )
				.populate( 'status' )
				.populate( 'legalStatus' )
				.exec()
				.then( children => {
					// TODO: This filter should happen in a .where() above
					// Filter out all children who don't have a status of 'active'
					children = _.filter( children, child => {
						return child.status.childStatus === 'active';
					});

					_.each( children, child => {
						// adjust the image to the blank male/female image if needed
						exports.setNoChildImage( req, res, child );
						// set extra information needed for rendering the child to the page
						child.age						= middleware.getAge( child.birthDate );
			    		child.ageConverted				= middleware.convertDate( child.birthDate );
			    		child.registrationDateConverted	= middleware.convertDate( child.registrationDate );
					});

					locals.allChildren = children;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					// execute done function if async is used to continue the flow of execution
					done();

				});
};

exports.getUnrestrictedChildren = ( req, res, done ) => {

	var locals = res.locals;

	Child.model.find()
				.where( 'siteVisibility', 'everyone' )
				.populate( 'gender' )
				.populate( 'race' )
				.populate( 'language' )
				.populate( 'disabilities' )
				.populate( 'otherConsiderations' )
				.populate( 'recommendedFamilyConstellation' )
				.populate( 'otherFamilyConstellationConsideration' )
				.populate( 'status' )
				.populate( 'legalStatus' )
				.exec()
				.then( children => {
					// TODO: This filter should happen in a .where() above
					// Filter out all children who don't have a status of 'active'
					children = _.filter( children, child => {
						return child.status.childStatus === 'active';
					});

					_.each(children, child => {
						// adjust the image to the blank male/female image if needed
						exports.setNoChildImage( req, res, child );
						// set extra information needed for rendering the child to the page
						child.age						= middleware.getAge( child.birthDate );
			    		child.ageConverted				= middleware.convertDate( child.birthDate );
			    		child.registrationDateConverted	= middleware.convertDate( child.registrationDate );

					});

					locals.allChildren = children;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					// execute done function if async is used to continue the flow of execution
					done();

				});
};

/* Sets the images for display in the gallery to a blank male/female face in the following cases:
 *	1. No image was uploaded for the child
 *	2. The child has been identified as legal risk
 */
exports.setNoChildImage = ( req, res, child ) => {
	// Constant definitions.  TODO: Change these to const instead of var once support for ES2015 improves
	const NO_IMAGE_MALE_GALLERY = 'images/no-image-male_gallery.png';
	const NO_IMAGE_MALE_DETAILS = 'images/no-image-male_detail.png';
	const NO_IMAGE_FEMALE_GALLERY = 'images/no-image-female_gallery.png';
	const NO_IMAGE_FEMALE_DETAILS = 'images/no-image-female_detail.png';
	// If there's no image or if the child has been identified as legal risk set the correct picture for males/females

	if( child.image.url === undefined || child.legalStatus.legalStatus === 'legal risk' ) {

		if( child.gender.gender === 'male' ) {

			child.detailImage = NO_IMAGE_MALE_DETAILS;
			child.galleryImage = NO_IMAGE_MALE_GALLERY;

		} else if( child.gender.gender === 'female' ) {

			child.detailImage = NO_IMAGE_FEMALE_DETAILS;
			child.galleryImage = NO_IMAGE_FEMALE_GALLERY;

		}
	}
};
// TODO: combine the below two functions, and adjust the calling code to pass and accept arrays
exports.getChildByRegistrationNumber = ( req, res, done, registrationNumber ) => {

	let locals = res.locals;
	// convert the number as a string to a number
	const targetRegistrationNumber = parseInt( registrationNumber, 10 );

	Child.model.find()
			.where('registrationNumber', targetRegistrationNumber )
			.exec()
			.then( child => {

				locals.child = child[ 0 ];
				// execute done function if async is used to continue the flow of execution
 				// TODO: if this is used in non-async middleware, done or next should be passed into options and the appropriate one should be executed
				done();

			}, err => {

				console.log( err );
				done();

			});

};

exports.getChildrenByRegistrationNumbers = ( req, res, done, registrationNumbers ) => {

	let locals = res.locals;
	// convert the array of numbers as strings to an array of numbers
	const targetRegistrationNumbers = registrationNumbers.map( registrationNumber => parseInt( registrationNumber, 10 ) );

	Child.model.find()
			.where( 'registrationNumber' ).in( targetRegistrationNumbers )
			.exec()
			.then( children => {

				locals.children = children;
				// execute done function if async is used to continue the flow of execution
 				// TODO: if this is used in non-async middleware, done or next should be passed into options and the appropriate one should be executed
				done();

			}, err => {

				console.log( err );
				done();

			});

};

/* Expose the child data for the gallery view to the front-end via an API call */
exports.getGalleryData = ( req, res, next ) => {

	let locals				= res.locals;
	// create an array to store all children we fetch from the database
	locals.allChildren		= [];
	// create sets to store the individual children and sibling groups
	locals.soloChildren		= new Set();
	locals.siblingGroups	= new Set(); // format: Set( { ids: Set(), children: [] }, ... )
	// variables to determine what children the user has access to
	locals.userType			= req.user ? req.user.get('userType') : 'anonymous';
	locals.targetChildren	= locals.userType === 'anonymous' || locals.userType === 'site visitor' ? 'unrestricted' : 'all';

	async.series([
		done => {
			// fetch the appropriate set of children based on the user's permissions
			locals.targetChildren === 'all' ? exports.getAllChildren( req, res, done )
											: exports.getUnrestrictedChildren( req, res, done );

		},
		// TODO: these familyService functions are for social workers too, they belong in a page level service instead
		done => { familyService.setGalleryPermissions( req, res, done ); },
		done => { locals.canBookmarkChildren ? familyService.getBookmarkedChildren( req, res, done ) : done(); },
		done => {
			if( locals.bookmarkedChildren && locals.bookmarkedChildren.length > 0 ) {
				// Loop through each child model and set a property to show they've already been bookmarked by the user during templating
				_.each( locals.allChildren, function( child ) {
					// Get the child id to compare with the array of currently bookmarked child ids
					const childId = child.get( '_id' ).toString();
					// The bookmarked children come back as Objects, and need to be converted to strings for comparison
					// TODO: think about doing the mapping inside the getBookmarkedChildren function
					const bookmarkedChildrenArray = locals.bookmarkedChildren.map( childId => childId.toString() );
					// Set the property for use during templating to show if the child has already been bookmarked
					child.isBookmarked = locals.bookmarkedChildren.indexOf( childId ) !== -1 ? true : false;
				});

				done();

			} else {

				done();
			}
		},
	// once we have the returned children
	], () => {
		// assign each child to the solo child set or the sibling group set
		exports.assignChildren( locals.allChildren, locals );
		// map out the relevant information for solo children
		exports.getRelevantChildInformation( [ ...locals.soloChildren ], locals );
		// map out the relevant information for sibling groups
		exports.getRelevantSiblingGroupInformation( [ ...locals.siblingGroups], locals );
		// return the child and group information
		res.send( { soloChildren: locals.soloChildrenToReturn, siblingGroups: locals.siblingGroupsToReturn } );
	});
}

exports.assignChildren = ( children, locals ) => {
	// loop through each child records to determine whether they belong to a sibling group or by themselves
	for( let child of children ) {
		// if the child is solo
		if( !child.mustBePlacedWithSiblings ) {
			// add the child to the solo children set
			locals.soloChildren.add( child );
		// if the child is part of a group
		} else {
			// create a variable to store whether a matching group exists
			let hasMatch = false;
			// get the child's id
			const childId = child.get( '_id' ).toString();
			// loop through the existing sibling groups
			for( let group of locals.siblingGroups ) {
				// if the child's id is recognized as part of an existing group
				if( group.ids.has( childId ) ) {
					// note that we found a matching group
					hasMatch = true;
					// add the child object to that group
					group.children.push( child );
				}
			}
			// if the child isn't part of an existing group
			if( !hasMatch ) {
				// store the childs siblings to be placed with as an array of strings
                const siblingIdsArray = child.siblingsToBePlacedWith ? child.siblingsToBePlacedWith.map( sibling => sibling.toString() ) : [];
				// create a set including the current child's id, as well as the ids of the siblings they must be placed with
				const ids = new Set( [ childId, ...siblingIdsArray ] );
				// create an array with the current child
				const children = [ child ];
				// create a new object with the group information
				const newChildGroup = { ids, children };
				// add the new sibling group object to the set of groups
				locals.siblingGroups.add( newChildGroup );
			}
		}
	}
}

exports.getRelevantChildInformation = ( children, locals ) => {
	// create a mapping for the emotional, intellectual, and physical needs
	const needsMap = {
		'none'		: 0,
		'mild'		: 1,
		'moderate'	: 2,
		'severe'	: 3
	};

	locals.soloChildrenToReturn = children.map( child => {
		// Create a searchable array for dealing with other family constellation considerations
		var otherFamilyConstellationConsiderations = _.pluck( child.otherFamilyConstellationConsideration, 'otherFamilyConstellationConsideration' );

		return {
			age										: middleware.getAge( child.birthDate ),
			ageConverted							: middleware.convertDate( child.birthDate ),
			detailImage								: child.detailImage,
			disabilities							: _.pluck( child.disabilities, 'disability' ),
			emotionalNeeds							: needsMap[child.emotionalNeeds],
			galleryImage							: child.galleryImage,
			gender									: child.gender.gender,
			hasContactWithBiologicalParents			: child.hasContactWithBirthFamily || false,
			hasContactWithBiologicalSiblings		: child.hasContactWithSiblings || false,
			hasVideo								: child.video && child.video.length > 0 ? true : false,
			intellectualNeeds						: needsMap[ child.intellectualNeeds ],
			isBookmarked							: child.isBookmarked,
			language								: _.pluck( child.language, 'language' ),
			legalStatus								: child.legalStatus.legalStatus,
			name									: child.name.first,
			noPets									: otherFamilyConstellationConsiderations.indexOf( 'no pets' ) !== -1,
			numberOfSiblings						: child.siblings.length,
			otherConsiderations						: _.pluck( child.otherConsiderations, 'otherConsideration' ),
			physicalNeeds							: needsMap[child.physicalNeeds],
			race									: _.pluck( child.race, 'race' ),
			recommendedFamilyConstellation			: _.pluck( child.recommendedFamilyConstellation, 'familyConstellation' ),
			registrationDateConverted				: middleware.convertDate( child.registrationDate ),
			registrationNumber						: child.registrationNumber,
			requiresNoSiblings						: otherFamilyConstellationConsiderations.indexOf( 'childless home' ) !== -1,
			requiresOlderSibling					: otherFamilyConstellationConsiderations.indexOf( 'requires older children' ) !== -1,
			requiresSiblings						: otherFamilyConstellationConsiderations.indexOf( 'multi-child home' ) !== -1,
			requiresYoungerSibling					: otherFamilyConstellationConsiderations.indexOf( 'requires younger children' ) !== -1,
			siblingContactsCount					: child.siblingsToBePlacedWith.length,
			updatedAt								: child.updatedAt,
			wednesdaysChild							: child.wednesdaysChild
		};
	});
}

exports.getRelevantSiblingGroupInformation = ( siblingGroups, locals ) => {
	// create a mapping for the emotional, intellectual, and physical needs
	const needsMap = {
		'none'		: 0,
		'mild'		: 1,
		'moderate'	: 2,
		'severe'	: 3
	};

	locals.siblingGroupsToReturn = siblingGroups.map( group => {
		// cache the children array from the group for faster lookups
		const children = group.children;
		// Create a searchable array for dealing with other family constellation considerations
		// map will return an array of arrays, one from each child, flatten will turn them into a single array
		const otherFamilyConstellationConsiderations = _.flatten( children.map( child => {
			// pulls all values listed into an array and returns it for the current child
			return _.pluck( child.otherFamilyConstellationConsideration, 'otherFamilyConstellationConsideration' );
		}));

		const namesArray				= children.map( child => child.name.first );
		const agesArray					= children.map( child => middleware.getAge( child.birthDate ) );
		const registrationNumbersArray	= children.map( child => child.registrationNumber );
		const legalStatusesArray		= _.uniq( children.map( child => child.legalStatus.legalStatus ) );

		return {
			
			ages									: agesArray,
			agesConverted							: children.map( child => middleware.convertDate( child.birthDate ) ),
			agesString								: middleware.getArrayAsList( agesArray ),
			detailImage								: children[ 0 ].siblingGroupDetailImage,
			disabilities							: _.uniq( _.flatten( children.map( child => _.pluck( child.disabilities, 'disability' ) ) ) ),
			emotionalNeeds							: _.uniq( children.map( child => needsMap[ child.emotionalNeeds ] ) ),
			galleryImage							: children[ 0 ].siblingGroupGalleryImage,
			genders									: _.uniq( children.map( child => child.gender.gender ) ),
			hasContactWithBiologicalParents			: _.uniq( children.map( child => child.hasContactWithBirthFamily || false ) ),
			hasContactWithBiologicalSiblings		: _.uniq( children.map( child => child.hasContactWithSiblings || false ) ),
			hasVideo								: _.uniq( children.map( child => child.siblingGroupVideo && child.siblingGroupVideo.length > 0 ? true : false ) ), // Need to add a group video
			intellectualNeeds						: _.uniq( children.map( child => needsMap[ child.intellectualNeeds ] ) ),
			isBookmarked							: children.map( child => child.isBookmarked === true ).indexOf( true ) !== -1 ? true : false, // set to true if any of the children have true for isBookmarked
			languages								: _.uniq( _.flatten( children.map( child => _.pluck(child.language, 'language' ) ) ) ),
			legalStatuses							: legalStatusesArray,
			legalStatusesString						: middleware.getArrayAsList( legalStatusesArray ),
			names									: namesArray,
			namesString								: middleware.getArrayAsList( namesArray ),
			noPets									: _.uniq( children.map( child => otherFamilyConstellationConsiderations.indexOf( 'no pets' ) !== -1 ) ),
			numberOfSiblings						: _.uniq( children.map( child => child.siblings.length ) ), // TODO: Ask Lisa if the number of siblings between children can vary (think half siblings)
			otherConsiderations						: _.uniq( _.flatten( children.map( child => _.pluck( child.otherConsiderations, 'otherConsideration' ) ) ) ),
			physicalNeeds							: _.uniq( children.map( child => needsMap[ child.physicalNeeds ] ) ),
			races									: _.uniq( _.flatten( children.map( child => _.pluck(child.race, 'race' ) ) ) ),
			recommendedFamilyConstellations			: _.uniq( _.flatten( children.map( child => _.pluck( child.recommendedFamilyConstellation, 'familyConstellation' ) ) ) ),
			registrationDatesConverted				: children.map( child => middleware.convertDate( child.registrationDate ) ),
			registrationNumbers						: registrationNumbersArray,
			registrationNumbersString				: middleware.getArrayAsList( registrationNumbersArray ),	
			requiresNoSiblings						: _.uniq( children.map( child => otherFamilyConstellationConsiderations.indexOf( 'childless home' ) !== -1 ) ),
			requiresSiblings						: _.uniq( children.map( child => otherFamilyConstellationConsiderations.indexOf( 'multi-child home' ) !== -1 ) ),
			requiresOlderSibling					: _.uniq( children.map( child => otherFamilyConstellationConsiderations.indexOf( 'requires older children' ) !== -1 ) ),
			requiresYoungerSibling					: _.uniq( children.map( child => otherFamilyConstellationConsiderations.indexOf( 'requires younger children' ) !== -1 ) ),	
			siblingContactsCount					: children[ 0 ].siblingsToBePlacedWith.length,
			updatedAt								: _.uniq( children.map( child => child.updatedAt ) ),
			wednesdaysChild							: _.uniq( children.map( child => child.wednesdaysChild ) )
		};
	});
}

exports.getChildDetails = ( req, res, next ) => {

	const childData = req.body;
	const registrationNumber = childData[ 'registrationNumber' ];

	/* TODO: Fetch only the needed fields instead of grabbing everything */
	Child.model.findOne()
        .where( 'registrationNumber', registrationNumber )
        .populate( 'gender' )
        .exec()
        .then( child => {

        	const relevantData = {
				hasImage			: _.isEmpty( child.image ) && child.image.url.length > 0,
        		profilePart1		: child.profile.part1,
        		profilePart2		: child.profile.part2,
        		profilePart3		: child.profile.part3,
        		video				: child.video && child.video.length > 0 ? child.video.replace( 'watch?v=', 'embed/' ) : undefined
        	};

        	res.send( relevantData );

        }, err => {

			console.log( err );

			done();
		});
};

exports.getSiblingGroupDetails = ( req, res, next ) => {
	// the group data is stored in each child record, so we can use a single child to populate everything
	const childData = req.body;
	const registrationNumber = childData[ 'registrationNumber' ];

	/* TODO: Fetch only the needed fields instead of grabbing everything */
	Child.model.findOne()
        .where( 'registrationNumber', registrationNumber )
        .populate( 'gender' )
        .exec()
        .then( child => {

        	const relevantData = {
				hasImage			: _.isEmpty( child.siblingGroupImage ) && child.siblingGroupImage.url.length > 0,
        		profilePart1		: child.groupProfile.part1,
        		profilePart2		: child.groupProfile.part2,
        		profilePart3		: child.groupProfile.part3,
        		video				: child.siblingGroupVideo && child.siblingGroupVideo.length > 0 ? child.siblingGroupVideo.replace('watch?v=', 'embed/') : undefined
        	};

        	res.send( relevantData );

        }, err => {

			console.log( err );

			done();
		});
};