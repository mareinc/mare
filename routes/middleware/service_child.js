const keystone								= require( 'keystone' ),
	  _										= require( 'underscore' ),
	  async									= require( 'async' ),
	  Child									= keystone.list( 'Child' ),
	  ChildStatus							= keystone.list( 'Child Status' ),
	  middleware							= require( './middleware' ),
	  familyService							= require( './service_family' ),
	  listsService							= require( './service_lists' ),
	  userService							= require( './service_user' ),
	  socialWorkerChildRegistrationService	= require( './emails_social-worker-child-registration' );

// TODO: combine the below two functions, the only difference in the filter in the find()
exports.getAllChildren = ( req, res, done, fieldsToSelect ) => {

	let locals = res.locals;

	Child.model.find()
				.select( fieldsToSelect )
				.where( 'status').equals( locals.activeChildStatusId )
				.populate( 'gender' )
				.populate( 'race' )
				.populate( 'languages' )
				.populate( 'disabilities' )
				.populate( 'otherConsiderations' )
				.populate( 'recommendedFamilyConstellation' )
				.populate( 'otherFamilyConstellationConsideration' )
				.populate( 'status' )
				.populate( 'legalStatus' )
				.exec()
				.then( children => {
					// loop through each child
					_.each( children, child => {
						// adjust the image to the blank male/female image if needed
						exports.setNoChildImage( req, res, child, locals.targetChildren === 'all' );
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

exports.getUnrestrictedChildren = ( req, res, done, fieldsToSelect ) => {

	var locals = res.locals;
	
	// find all children who are active, and are either visible to everyone or have the 'child is visible on MARE web' checkbox checked
	Child.model.find( { $or: [
					{ 'siteVisibility': 'everyone' },
					{ 'isVisibleInGallery': true } ] } )
				.select( fieldsToSelect )
				.where( 'status').equals( locals.activeChildStatusId )
				.populate( 'gender' )
				.populate( 'race' )
				.populate( 'languages' )
				.populate( 'disabilities' )
				.populate( 'otherConsiderations' )
				.populate( 'recommendedFamilyConstellation' )
				.populate( 'otherFamilyConstellationConsideration' )
				.populate( 'status' )
				.populate( 'legalStatus' )
				.exec()
				.then( children => {
					// loop through each child
					_.each( children, child => {
						// adjust the image to the blank male/female image if needed
						exports.setNoChildImage( req, res, child, locals.targetChildren === 'all' );
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
 *  3. The child is not visible to everyone, and the user wouldn't have permission to see them without the 'child is visible on MARE web' checkbox being checked
 */
exports.setNoChildImage = ( req, res, child, canViewAllChildren ) => {

	const NO_IMAGE_MALE_GALLERY				= 'images/no-image-male_gallery.png',
		  NO_IMAGE_MALE_DETAILS				= 'images/no-image-male_details.png',
		  NO_IMAGE_FEMALE_GALLERY			= 'images/no-image-female_gallery.png',
		  NO_IMAGE_FEMALE_DETAILS			= 'images/no-image-female_details.png',
		  NO_IMAGE_OTHER_GALLERY			= 'images/no-image-other_gallery.png',
		  NO_IMAGE_OTHER_DETAILS			= 'images/no-image-other_details.png',
		  NO_IMAGE_SIBLING_GROUP_GALLERY	= 'images/no-image-sibling-group_gallery.png',
		  NO_IMAGE_SIBLING_GROUP_DETAILS	= 'images/no-image-sibling-group_details.png';	
	// if the child is part of a sibling group
	if( child.mustBePlacedWithSiblings ) {
		// and is missing an image or is legal risk
		if( !child.siblingGroupImage.secure_url || child.legalStatus.legalStatus === 'legal risk' ) {
			// set the images to the placeholders for sibling groups
			child.siblingGroupDetailImage = NO_IMAGE_SIBLING_GROUP_DETAILS;
			child.siblingGroupGalleryImage = NO_IMAGE_SIBLING_GROUP_GALLERY;
		}
	// if the child is not part of a sibling group
	} else {
		if( !child.image.secure_url								// and is missing an image
			|| child.legalStatus.legalStatus === 'legal risk' 	// or is legal risk
			|| ( child.siteVisibility !== 'everyone' 			// or if the child is not visible to everyone
			 	&& !canViewAllChildren ) ) {					// 	and the user wouldn't have permission without the 'child is visible on MARE web' checkbox being checked
			// and the child is male
			if( child.gender.gender === 'male' ) {
				// set the images to the placeholder for male children
				child.detailImage = NO_IMAGE_MALE_DETAILS;
				child.galleryImage = NO_IMAGE_MALE_GALLERY;
			// but if the child is female
			} else if( child.gender.gender === 'female' ) {
				// set the images to the placeholder for female children
				child.detailImage = NO_IMAGE_FEMALE_DETAILS;
				child.galleryImage = NO_IMAGE_FEMALE_GALLERY;
			// but if the child is neither male nor female
			} else {
				// set the images to the placeholder for transgender/other children
				child.detailImage = NO_IMAGE_OTHER_DETAILS;
				child.galleryImage = NO_IMAGE_OTHER_GALLERY;
			}
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
	locals.userType			= req.user ? req.user.get( 'userType' ) : 'anonymous';
	// anonymous users, site visitors, and families without a verified homestudy have access only to unrestricted children
	if( locals.userType === 'anonymous' ||
		locals.userType === 'site visitor' ||
		( locals.userType === 'family' && !req.user.permissions.canViewAllChildren ) ) {
		locals.targetChildren = 'unrestricted';
	// families with a verified homestudy and social workers have access to all children
	} else {
		locals.targetChildren = 'all';
	}
	// create a string with the fields to select from each child (this speeds up the queries)
	const fieldsToSelect = `gender race languages disabilities otherConsiderations recommendedFamilyConstellation
							otherFamilyConstellationConsideration status legalStatus birthDate registrationDate
							image siblingGroupImage siblingGroupDetailImage siblingGroupGalleryImage siteVisibility
							detailImage galleryImage emotionalNeeds hasContactWithBirthFamily hasContactWithSiblings
							video intellectualNeeds isBookmarked name siblings physicalNeeds registrationNumber
							siblingsToBePlacedWith updatedAt wednesdaysChild mustBePlacedWithSiblings siblingGroupVideo`;

	async.series([
		done => { listsService.getChildStatusIdByName( req, res, done, 'active' ) },
		done => {
			// fetch the appropriate set of children based on the user's permissions
			locals.targetChildren === 'all' ? exports.getAllChildren( req, res, done, fieldsToSelect )
											: exports.getUnrestrictedChildren( req, res, done, fieldsToSelect );

		},
		// TODO: these familyService functions are for social workers too, they belong in a page level service instead
		done => { familyService.setGalleryPermissions( req, res ); done(); },
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
			hasContactWithBiologicalParents			: child.hasContactWithBirthFamily || false, // TODO: is the || false needed?
			hasContactWithBiologicalSiblings		: child.hasContactWithSiblings || false, // TODO: is the || false needed?
			hasVideo								: child.video && child.video.length > 0 ? true : false, // TODO: is the ? true : false necessary?
			intellectualNeeds						: needsMap[ child.intellectualNeeds ],
			isBookmarked							: child.isBookmarked,
			language								: _.pluck( child.languages, 'language' ),
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

	const NO_IMAGE_SIBLING_GROUP_GALLERY	= 'images/no-image-sibling-group_gallery',
		  NO_IMAGE_SIBLING_GROUP_DETAILS	= 'images/no-image-sibling-group_details';

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
			detailImage								: _.uniq( children.map( child => child.siblingGroupDetailImage ) ).indexOf( NO_IMAGE_SIBLING_GROUP_DETAILS ) !== -1 ? NO_IMAGE_SIBLING_GROUP_DETAILS : children[ 0 ].siblingGroupDetailImage,
			disabilities							: _.uniq( _.flatten( children.map( child => _.pluck( child.disabilities, 'disability' ) ) ) ),
			emotionalNeeds							: _.uniq( children.map( child => needsMap[ child.emotionalNeeds ] ) ),
			galleryImage							:  _.uniq( children.map( child => child.siblingGroupGalleryImage ) ).indexOf( NO_IMAGE_SIBLING_GROUP_DETAILS ) !== -1 ? NO_IMAGE_SIBLING_GROUP_DETAILS : children[ 0 ].siblingGroupGalleryImage,
			genders									: _.uniq( children.map( child => child.gender.gender ) ),
			hasContactWithBiologicalParents			: _.uniq( children.map( child => child.hasContactWithBirthFamily || false ) ), // TODO: is the || false needed?
			hasContactWithBiologicalSiblings		: _.uniq( children.map( child => child.hasContactWithSiblings || false ) ), // TODO: is the || false needed?
			hasVideo								: children.filter( child => child.siblingGroupVideo && child.siblingGroupVideo.length > 0 ).length > 0,
			intellectualNeeds						: _.uniq( children.map( child => needsMap[ child.intellectualNeeds ] ) ),
			isBookmarked							: children.map( child => child.isBookmarked ).indexOf( true ) !== -1 ? true : false, // set to true if any of the children have true for isBookmarked
			languages								: _.uniq( _.flatten( children.map( child => _.pluck(child.languages, 'language' ) ) ) ),
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
			wednesdaysChild							: children.map( child => child.wednesdaysChild ).indexOf( true ) !== -1 ? true : false
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
				hasImage				: _.isEmpty( child.image ) && child.image.url.length > 0,
				quote					: child.profile.quote,
        		profilePart1			: child.profile.part1,
        		profilePart2			: child.profile.part2,
        		profilePart3			: child.profile.part3,
        		video					: child.video && child.video.length > 0 ? child.video.replace( 'watch?v=', 'embed/' ) : undefined,
				wednesdaysChildVideo	: child.wednesdaysChildVideo && child.wednesdaysChildVideo.length > 0 ? child.wednesdaysChildVideo.replace( 'watch?v=', 'embed/' ) : undefined
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
				hasImage				: _.isEmpty( child.siblingGroupImage ) && child.siblingGroupImage.url.length > 0,
				quote					: child.groupProfile.quote,
        		profilePart1			: child.groupProfile.part1,
        		profilePart2			: child.groupProfile.part2,
        		profilePart3			: child.groupProfile.part3,
        		video					: child.siblingGroupVideo && child.siblingGroupVideo.length > 0 ? child.siblingGroupVideo.replace('watch?v=', 'embed/') : undefined,
				wednesdaysChildVideo	: child.wednesdaysChildSiblingGroupVideo && child.wednesdaysChildSiblingGroupVideo.length > 0 ? child.wednesdaysChildSiblingGroupVideo.replace( 'watch?v=', 'embed/' ) : undefined
        	};

        	res.send( relevantData );

        }, err => {

			console.log( err );

			done();
		});
};

exports.fetchChildStatusId = status => {

	return new Promise( ( resolve, reject ) => {
		ChildStatus.model.findOne()
				.where( 'childStatus', status )
				.exec()
				.then( status => {

					status ? resolve( status.get( '_id' ) ) : resolve();

				}, err => {

					reject();

				});
	});
};

/* called when a social worker attempts to register a family */
exports.registerChild = ( req, res, next ) => {
	// extract the child details submitted through the req object
	const child = req.body;
	// store a reference to locals to allow access to globally available data
	const locals = res.locals;
	// set the redirect path to navigate to after processing is complete
	locals.redirectPath = '/forms/child-registration-form';
	// fetch the id for the active child status
	const fetchActiveChildStatusId		= exports.fetchChildStatusId( 'active' );
	
	fetchActiveChildStatusId.then( activeChildStatusId => {
		// create a new Child model
		const newChild = new Child.model({

			siteVisibility: 'registered social workers and families',
			isVisibleInGallery: false,

			registeredBy: 'unknown',
			registrationDate: new Date(),

			name: {
				first: child.firstName,
				last: child.lastName,
				alias: child.alias,
				nickName: child.nickName
			},

			birthDate: new Date( child.dateOfBirth ),
			languages: child.languages,
			status: activeChildStatusId,
			gender: child.gender,
			race: child.race,
			legalStatus: child.legalStatus,
			yearEnteredCare: child.yearEnteredCare,

			hasContactWithSiblings: child.isSiblingContactNeeded.toLowerCase() === 'yes',
			siblingTypeOfContact: child.siblingContactDescription,
			hasContactWithBirthFamily: child.isFamilyContactNeeded.toLowerCase() === 'yes',
			birthFamilyTypeOfContact: child.familyContactDescription,

			residence: child.currentResidence,
			isOutsideMassachusetts: child.isNotMACity,
			city: child.isNotMACity ? undefined : child.MACity,
			cityText: child.isNotMACity ? child.nonMACity : '',
			
			careFacilityName: child.careFacility,

			physicalNeeds: 'none',
			physicalNeedsDescription: child.physicalNeeds,
			emotionalNeeds: 'none',
			emotionalNeedsDescription: child.emotionalNeeds,
			intellectualNeeds: 'none',
			intellectualNeedsDescription: child.intellectualNeeds,
			socialNeeds: 'none',
			socialNeedsDescription: child.socialNeeds,

			aspirations: child.aspirations,

			schoolLife: child.schoolLife,
			familyLife: child.familyLife,
			personality: child.personality,
			otherRecruitmentConsiderations: child.otherRecruitmentConsiderations,

			disabilities: child.disabilities,
			recommendedFamilyConstellation: child.recommendedFamilyConstellations,
			otherFamilyConstellationConsideration: child.otherFamilyConstellationConsiderations,
			otherConsiderations: child.otherConsiderations
		});

		newChild.save( ( err, child ) => {

			if( err ) {
				console.error( `error saving social registered child: ${ err }` );
				// create an error flash message
				req.flash( 'error', {
						title: `There was an error registering your child`,
						detail: `If this error persists, please notify MARE` } );
				// redirect the user to the appropriate page
				res.redirect( 303, locals.redirectPath );
			} else {
				console.log( `new child saved` );
				// create a success flash message
				req.flash( 'success', {
						title: `Congratulations, your child record has been successfully registered.`,
						detail: `Please note that it can take several days for the child's account to be reviewed and activated.` } );
				// attempt to send relevant emails and store the returned promises
				let staffEmailSent			= socialWorkerChildRegistrationService.sendRegistrationConfirmationEmailToStaff( child );
				let socialWorkerEmailSent	= socialWorkerChildRegistrationService.sendRegistrationConfirmationEmailToSocialWorker( child );
				// if all emails sent successfully
				Promise.all( [ staffEmailSent, socialWorkerEmailSent ] ).then( () => {
					// redirect the user to the appropriate page
					res.redirect( 303, locals.redirectPath );
				// if there was an error sending emails
				}).catch( reason => {
					// redirect the user back to the appropriate page
					res.redirect( 303, redirectPath );
				});
			}
		});
	});
};

// ------------------------------------------------------------------------------------------ //

// TODO: these functions below are copies of functions above built with async.  They're rewritten with Promises
//		 and will replace the functions above once async has been removed

// ------------------------------------------------------------------------------------------ //

/* fetch a single child by their registration number */
exports.getChildByRegistrationNumberNew = registrationNumber => {

	return new Promise( ( resolve, reject ) => {
		// convert the registration number to a number if it isn't already
		const targetRegistrationNumber = parseInt( registrationNumber, 10 );

		// if no registration number was passed in, or the number is invalid
		if( !registrationNumber
			|| typeof registrationNumber !== 'number'
			|| typeof registrationNumber !== 'string'
			|| ( typeof registrationNumber === 'string' && registrationNumber.length === 0 )
			|| ( typeof registrationNumber === 'number' && Number.isNaN( targetRegistrationNumber ) ) ) {
				// log an error for debugging purposes
				console.error( `the registration number was either not provided or invalid
								number: ${ registrationNumber }
								type: ${ typeof registrationNumber }` );
				// reject the promise
				reject();
		}
		// attempt to find a single child matching the passed in registration number
		Child.model.findOne()
			.where( 'registrationNumber' ).equals( targetRegistrationNumber )
			.lean()
			.exec()
			// if the database fetch executed successfully
			.then( child => {
				// if the target child could not be found
				if( !child ) {
					// log an error for debugging purposes
					console.error( `no child matching registration number '${ registrationNumber } could be found` );
					// reject the promise
					return reject();
				}
				// if the target child was found, resolve the promise with the lean version of the object
				resolve( child );
			// if there was an error fetching from the database
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching child matching registration number ${ registrationNumber } - ${ err }` );
				// and reject the promise
				reject();
			});
	});
};

/* fetch multiple children based on a passed in array of registration numbers */
exports.getChildrenByRegistrationNumbersNew = registrationNumbers => {

	return new Promise( ( resolve, reject ) => {
		// if either the registraton numbers were not an array or if no registration numbers were passed in
		if( !registrationNumber
			|| Array.isArray( registrationNumbers )
			|| ( Array.isArray( registrationNumbers ) && registrationNumbers.length === 0 ) ) {
				// log an error for debugging purposes
				console.error( `the registration numbers were either not provided not an array
								number: ${ registrationNumbers }
								type: ${ typeof registrationNumbers }` );
				// reject the promise
				reject();
		}

		// convert the array of numbers as strings to an array of numbers
		const targetRegistrationNumbers = registrationNumbers.map( registrationNumber => parseInt( registrationNumber, 10 ) );

		// attempt to find all children matching the passed in registration numbers
		Child.model.find()
			.where( 'registrationNumber' ).in( targetRegistrationNumbers )
			.lean()
			.exec()
			.then( children => {
				// if the target child could not be found
				if( !children || children.length === 0 ) { // TODO: see if we need to check for existence
					// log an error for debugging purposes
					console.error( `no children matching registration numbers '${ registrationNumbers.join( ', ' ) } could be found` );
					// reject the promise
					return reject();
				}
				// if the target child was found, resolve the promise with the lean version of the object
				resolve( children );
			// if there was an error fetching from the database
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching children matching registration numbers ${ registrationNumbers.join( ', ' ) } - ${ err }` );
				// and reject the promise
				reject();
			});
	});
};