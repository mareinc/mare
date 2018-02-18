const keystone									= require( 'keystone' ),
	  _											= require( 'underscore' ),
	  async										= require( 'async' ),
	  middleware								= require( './middleware' ),
	  emailTargetMiddleware						= require( './service_email-target' ),
	  staffEmailContactMiddleware				= require( './service_staff-email-contact' ),
	  familyService								= require( './service_family' ),
	  listsService								= require( './service_lists' ),
	  userService								= require( './service_user' ),
	  socialWorkerChildRegistrationEmailService	= require( './emails_social-worker-child-registration' );

exports.getMaxRegistrationNumber = function() {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Child' ).model
			.findOne()
			.sort( '-registrationNumber' )
			.exec()
			.then( child => {
				if( child ) {
					return resolve( child.get( 'registrationNumber' ) );
				}

				resolve( 0 );
			}, err => {
				reject( `error fetching maximum registration number for children` );
			});
	});
};
// TODO: combine the below two functions, the only difference in the filter in the find()
exports.getAllChildren = ( req, res, done, fieldsToSelect ) => {
	// store a reference to locals
	const locals = res.locals;

	keystone.list( 'Child' ).model
		.find()
		.select( fieldsToSelect )
		.where( 'isVisibleInGallery' ).equals( true )
		.where( 'status' ).equals( locals.activeChildStatusId )
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

exports.getChildrenForSocialWorkerAccount = ( req, res, done, fieldsToSelect ) => {
	// store a reference to locals
	const locals = res.locals;
	// create a map to convert social worker positions to their corresponding field names on the Child model
	const socialWorkerPositionFieldNames = {
		'adoption worker': 'adoptionWorker',
		'recruitment worker': 'recruitmentWorker'
	};

	if ( locals.userType === 'social worker' ) {

		let socialWorker = locals.user;
		// TODO: update other code to populate models we already have this way.  This will get us one step closer to single fetch functions instead of one offs
		// populate the social worker's positions
		socialWorker.populate( 'positions', err => {

			if ( err ) {

				console.error( `error populating the social worker's positions - cannot complete children gallery data fetch for social worker: ${ socialWorker._id }` );
				res.send({
					status: 'error',
					message: `could not determine social worker's positions, children gallery data cannot be loaded`
				});
			} else {

				// construct a query to search Children models from the Social Worker's valid positions
				let socialWorkerPositionQuery = socialWorker.positions.map( position => {

					// get the field name ( if one exists ) on the Child model that corresponds to a social worker's position
					let socialWorkerFieldOnChildModel = socialWorkerPositionFieldNames[ position.position ];

					// if a field for the social worker's position exists on the Child model, add it to the query
					if ( socialWorkerFieldOnChildModel ) {

						return { [ socialWorkerFieldOnChildModel ]: socialWorker._id };
					}

				})
				// filter out any invalid positions
				.filter( query => query );

				// check to ensure there was at least one valid position type to query with
				if ( socialWorkerPositionQuery.length > 0 ) {

					keystone.list( 'Child' ).model
							.find()
							.select( fieldsToSelect )
							.or( socialWorkerPositionQuery )
							.populate( 'gender' )
							.populate( 'race' )
							.populate( 'languages' )
							.populate( 'disabilities' )
							.populate( 'otherConsiderations' )
							.populate( 'recommendedFamilyConstellation' )
							.populate( 'otherFamilyConstellationConsideration' )
							.populate( 'status' )
							.populate( 'legalStatus' )
							.exec( ( err, children ) => {

								if ( err ) {

									console.error( err );
									done();
								} else {

									// loop through each child
									_.each( children, child => {
										// adjust the image to the blank male/female image if needed
										exports.setNoChildImage( req, res, child, locals.targetChildren === 'all' );
										// set extra information needed for rendering the child to the page
										child.age						= middleware.getAge( child.birthDate );
										child.ageConverted				= middleware.convertDate( child.birthDate );
										child.registrationDateConverted	= middleware.convertDate( child.registrationDate );
									});

									// filter out any children that are not active or on hold
									let displayChildren = children.filter( child => child.status.childStatus === 'active' || child.status.childStatus === 'on hold' );

									locals.allChildren = displayChildren;
									// execute done function if async is used to continue the flow of execution
									done();
								}
							});
				} else {

					// if a social worker that is neither an adoption or recruitment agent is trying to load a children gallery, log an error message
					console.error( `error constructing social worker account child gallery query - social worker: ${ socialWorker._id } does not have any valid position types` );
					res.send({
						status: 'error',
						message: `could not construct a valid query based on social worker's positions, children gallery data cannot be loaded`
					});
				}
			}
		});
	} else {

		// if an unauthorized user is trying to load this data, log an error message
		console.error( `error loading children gallery data - user of type ${ locals.userType } is trying to access a gallery restricted to social workers` );
		res.send({
			status: 'error',
			message: `error loading children gallery data - user of type ${ locals.userType } is trying to access a gallery restricted to social workers`
		});
	}
};

exports.getChildrenForFamilyAccount = ( req, res, done, fieldsToSelect ) => {
	// store a reference to locals
	const locals = res.locals;

	let bookmarkedChildren = locals.user.bookmarkedChildren.concat( locals.user.bookmarkedSiblings );

	keystone.list( 'Child' ).model
		.find()
		.select( fieldsToSelect )
		.where( '_id' ).in( bookmarkedChildren )
		.populate( 'gender' )
		.populate( 'race' )
		.populate( 'languages' )
		.populate( 'disabilities' )
		.populate( 'otherConsiderations' )
		.populate( 'recommendedFamilyConstellation' )
		.populate( 'otherFamilyConstellationConsideration' )
		.populate( 'status' )
		.populate( 'legalStatus' )
		.exec( ( err, children ) => {

			if ( err ) {

				console.error( err );
				done();
			} else {

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
				done();
			}
		});
};

exports.getChildrenByIds = idsArray => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Child' ).model
			.find()
			.where( '_id' ).in( idsArray )
			.exec()
			.then( children => {
				// if no children were returned
				if( children.length === 0 ) {
					// reject the promise with the reason why
					reject( `error fetching children by id array - no children found with ids ${ idsArray }` );
				}
				// resolve the promise with the returned children
				resolve( children );
			// if an error occurred fetching from the database
			}, err => {
				// reject the promise with details of the error
				reject( `error fetching children by id array ${ idsArray } - ${ err }` );
			});
	});
};

exports.getUnrestrictedChildren = ( req, res, done, fieldsToSelect ) => {
	// store a reference to locals
	const locals = res.locals;

	// find all children who are active, and are either visible to everyone or have the 'child is visible on MARE web' checkbox checked
	keystone.list( 'Child' ).model
		.find()
		.select( fieldsToSelect )
		.where( 'siteVisibility' ).equals( 'everyone' )
		.where( 'isVisibleInGallery' ).equals( true )
		.where( 'status' ).equals( locals.activeChildStatusId )
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

/* display the blank male/female/other image in the gallery in the following cases:
	1. No image was uploaded for the child
	2. The child has been identified as legal risk
	3. The child is not visible to everyone, and the user wouldn't have permission to see them without the 'child is visible on MARE web' checkbox being checked

	all other children will display their pictures normally
*/

/* display the blank sibling group image in the gallery in the following cases:

	1. No image was uploaded for the sibling group
	2. Any of the children have been identified as legal risk
	3. Any of the children are not visible to everyone, and the user wouldn't have permission to see them without the 'child is visible on MARE web' checkbox being checked

	all other sibling groups will display their pictures normally
*/
exports.setNoChildImage = ( req, res, child, canViewAllChildren ) => {

	const NO_IMAGE_MALE				= 'images/no-image-male.png',
		  NO_IMAGE_FEMALE			= 'images/no-image-female.png',
		  NO_IMAGE_OTHER			= 'images/no-image-other.png',
		  NO_IMAGE_SIBLING_GROUP	= 'images/no-image-sibling-group.png';
	// if the child is part of a sibling group
	if( child.mustBePlacedWithSiblings ) {
		// if the child image is missing or
		//	the child is legal risk and the user doesn't have permissions to view all children or
		//	the child visibility is 'Only Registered Social Workers and Families' and the user doesn't have permissions to view all children
		if( !child.hasSiblingGroupImage ||
			( child.legalStatus.legalStatus === 'legal risk' && !canViewAllChildren ) ||
			( child.siteVisibility !== 'everyone' && !canViewAllChildren ) ) {
			// set the images to the placeholders for sibling groups
			child.siblingGroupDisplayImage = NO_IMAGE_SIBLING_GROUP;
		// if it is acceptable to show the sibling group's image
		} else {
			child.siblingGroupDisplayImage = child.siblingGroupImage.secure_url;
		}
	// if the child is not part of a sibling group
	} else {
		//	if the child image is missing or
		//	the child is legal risk and the user doesn't have permissions to view all children or
		//	the child visibility is 'Only Registered Social Workers and Families' and the user doesn't have permissions to view all children
		if( !child.hasImage	||
			( child.legalStatus.legalStatus === 'legal risk' && !canViewAllChildren ) ||
			( child.siteVisibility !== 'everyone' && !canViewAllChildren ) ) {
			// and the child is male
			if( child.gender.gender === 'male' ) {
				// set the images to the placeholder for male children
				child.displayImage = NO_IMAGE_MALE;
			// but if the child is female
			} else if( child.gender.gender === 'female' ) {
				// set the images to the placeholder for female children
				child.displayImage = NO_IMAGE_FEMALE;
			// but if the child is neither male nor female
			} else {
				// set the images to the placeholder for transgender/other children
				child.displayImage = NO_IMAGE_OTHER;
			}
		// if it is acceptable to show the child's image
		} else {
			child.displayImage = child.image.secure_url;
		}
	}
};
// TODO: combine the below two functions, and adjust the calling code to pass and accept arrays
exports.getChildByRegistrationNumber = ( req, res, done, registrationNumber ) => {
	// store a reference to locals
	const locals = res.locals;
	// convert the number as a string to a number
	const targetRegistrationNumber = parseInt( registrationNumber, 10 );

	keystone.list( 'Child' ).model
		.find()
		.where( 'registrationNumber', targetRegistrationNumber )
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
	// store a reference to locals
	const locals = res.locals;
	// convert the array of numbers as strings to an array of numbers
	const targetRegistrationNumbers = registrationNumbers.map( registrationNumber => parseInt( registrationNumber, 10 ) );

	keystone.list( 'Child' ).model
		.find()
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
	// store a reference to locals
	const locals = res.locals;
	// create an array to store all children we fetch from the database
	locals.allChildren		= [];
	// create sets to store the individual children and sibling groups
	locals.soloChildren		= new Set();
	locals.siblingGroups	= new Set(); // format: Set( { ids: Set(), children: [] }, ... )
	// variables to determine what children the user has access to
	locals.userType			= req.user ? req.user.get( 'userType' ) : 'anonymous';
	// anonymous users, site visitors, and families without a verified homestudy ( or from a state other than MA, NH, CT, ME, VT, RI, or NY ) have access only to unrestricted children
	if( locals.userType === 'anonymous' ||
		locals.userType === 'site visitor' ||
		( locals.userType === 'family' && !req.user.permissions.canViewAllChildren ) ||
		( locals.userType === 'social worker' && !req.user.permissions.canViewAllChildren ) ) {
		locals.targetChildren = 'unrestricted';
	// families with a verified homestudy ( from MA, NH, CT, ME, VT, RI, or NY ) and social workers have access to all children
	} else {
		locals.targetChildren = 'all';
	}
	// create a string with the fields to select from each child (this speeds up the queries)
	const fieldsToSelect = `gender race languages disabilities otherConsiderations recommendedFamilyConstellation
							otherFamilyConstellationConsideration status legalStatus birthDate registrationDate
							image siblingGroupImage siteVisibility emotionalNeeds hasContactWithBirthFamily
							hasContactWithSiblings video intellectualNeeds isBookmarked name siblings physicalNeeds
							registrationNumber siblingsToBePlacedWith updatedAt wednesdaysChild mustBePlacedWithSiblings
							siblingGroupVideo`;

	async.series([
		done => { listsService.getChildStatusIdByName( req, res, done, 'active' ) },
		done => {

			// fetch the appropriate set of children based on the user's permissions and the page that's being requested

			// if the user is requesting the account page
			if ( req.body.requestPage === 'account' ) {
				// determine which children to show based on the user's type
				if ( locals.userType === 'family' ) {
					exports.getChildrenForFamilyAccount( req, res, done, fieldsToSelect );
				} else if ( locals.userType === 'social worker' ) {
					exports.getChildrenForSocialWorkerAccount( req, res, done, fieldsToSelect );
				}
			// if the user is not requesting the account page
			} else {
				// determine which chidlren to show based on the user's access permissions
				if ( locals.targetChildren === 'all' ) {
					exports.getAllChildren( req, res, done, fieldsToSelect );
				} else {
					exports.getUnrestrictedChildren( req, res, done, fieldsToSelect );
				}
			}
		},
		// TODO: these familyService functions are for social workers too, they belong in a page level service instead
		done => { familyService.setGalleryPermissions( req, res ); done(); },
		done => { locals.canBookmarkChildren ? familyService.getBookmarkedChildren( req, res, done ) : done(); },
		done => {
			if( locals.bookmarkedChildren && locals.bookmarkedChildren.length > 0 ) {
				// loop through each child model and set a property to show they've already been bookmarked by the user during templating
				_.each( locals.allChildren, function( child ) {
					// get the child id to compare with the array of currently bookmarked child ids
					const childId = child.get( '_id' ).toString();
					// the bookmarked children come back as Objects, and need to be converted to strings for comparison
					// TODO: think about doing the mapping inside the getBookmarkedChildren function
					const bookmarkedChildrenArray = locals.bookmarkedChildren.map( childId => childId.toString() );
					// set the property for use during templating to show if the child has already been bookmarked
					child.isBookmarked = locals.bookmarkedChildren.indexOf( childId ) !== -1;
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
		exports.getRelevantSiblingGroupInformation( [ ...locals.siblingGroups ], locals );
		// return the child and group information
		res.send( { soloChildren: locals.soloChildrenToReturn, siblingGroups: locals.siblingGroupsToReturn, status: 'success' } );
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
		// create a searchable array for dealing with other family constellation considerations
		var otherFamilyConstellationConsiderations = _.pluck( child.otherFamilyConstellationConsideration, 'otherFamilyConstellationConsideration' );

		return {
			age										: middleware.getAge( child.birthDate ),
			ageConverted							: middleware.convertDate( child.birthDate ),
			image									: child.displayImage,
			disabilities							: _.pluck( child.disabilities, 'disability' ),
			emotionalNeeds							: needsMap[child.emotionalNeeds],
			gender									: child.gender.gender,
			hasContactWithBiologicalParents			: child.hasContactWithBirthFamily,
			hasContactWithBiologicalSiblings		: child.hasContactWithSiblings,
			hasVideo								: child.video && child.video.length > 0,
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
			olderChildrenAcceptable					: otherFamilyConstellationConsiderations.indexOf( 'older children acceptable' ) !== -1,
			requiresSiblings						: otherFamilyConstellationConsiderations.indexOf( 'multi-child home' ) !== -1,
			youngerChildrenAcceptable				: otherFamilyConstellationConsiderations.indexOf( 'younger children acceptable' ) !== -1,
			siblingToBePlacedWithCount				: child.siblingsToBePlacedWith.length, /* TODO: do we need to return this? */
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

	const NO_IMAGE_SIBLING_GROUP_PATH	= 'images/no-image-sibling-group';

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

			ages									: _.sortBy( agesArray ),
			agesConverted							: _.sortBy( children.map( child => middleware.convertDate( child.birthDate ) ) ),
			agesString								: middleware.getArrayAsList( _.sortBy( agesArray ) ),
			image									: _.uniq( children.map( child => child.siblingGroupDisplayImage ) ).indexOf( NO_IMAGE_SIBLING_GROUP_PATH ) !== -1 ? NO_IMAGE_SIBLING_GROUP_PATH : children[ 0 ].siblingGroupDisplayImage,
			disabilities							: _.uniq( _.flatten( children.map( child => _.pluck( child.disabilities, 'disability' ) ) ) ),
			emotionalNeeds							: _.uniq( children.map( child => needsMap[ child.emotionalNeeds ] ) ),
			genders									: _.uniq( children.map( child => child.gender.gender ) ),
			hasContactWithBiologicalParents			: _.uniq( children.map( child => child.hasContactWithBirthFamily ) ),
			hasContactWithBiologicalSiblings		: _.uniq( children.map( child => child.hasContactWithSiblings ) ),
			hasVideo								: children.filter( child => child.siblingGroupVideo && child.siblingGroupVideo.length > 0 ).length > 0,
			intellectualNeeds						: _.uniq( children.map( child => needsMap[ child.intellectualNeeds ] ) ),
			isBookmarked							: children.map( child => child.isBookmarked ).indexOf( true ) !== -1, // set to true if any of the children have true for isBookmarked
			languages								: _.uniq( _.flatten( children.map( child => _.pluck(child.languages, 'language' ) ) ) ),
			legalStatuses							: legalStatusesArray,
			legalStatusesString						: middleware.getArrayAsList( legalStatusesArray ),
			names									: _.sortBy( namesArray ),
			namesString								: middleware.getArrayAsList( _.sortBy( namesArray ) ),
			noPets									: _.uniq( children.map( child => otherFamilyConstellationConsiderations.indexOf( 'no pets' ) !== -1 ) ),
			numberOfSiblings						: _.uniq( children.map( child => child.siblings.length ) ), // TODO: Ask Lisa if the number of siblings between children can vary (think half siblings)
			otherConsiderations						: _.uniq( _.flatten( children.map( child => _.pluck( child.otherConsiderations, 'otherConsideration' ) ) ) ),
			physicalNeeds							: _.uniq( children.map( child => needsMap[ child.physicalNeeds ] ) ),
			races									: _.uniq( _.flatten( children.map( child => _.pluck(child.race, 'race' ) ) ) ),
			recommendedFamilyConstellations			: _.uniq( _.flatten( children.map( child => _.pluck( child.recommendedFamilyConstellation, 'familyConstellation' ) ) ) ),
			registrationDatesConverted				: _.sortBy( children.map( child => middleware.convertDate( child.registrationDate ) ) ),
			registrationNumbers						: _.sortBy( registrationNumbersArray ),
			registrationNumbersString				: middleware.getArrayAsList( _.sortBy( registrationNumbersArray ) ),
			requiresNoSiblings						: _.uniq( children.map( child => otherFamilyConstellationConsiderations.indexOf( 'childless home' ) !== -1 ) ),
			requiresSiblings						: _.uniq( children.map( child => otherFamilyConstellationConsiderations.indexOf( 'multi-child home' ) !== -1 ) ),
			olderChildrenAcceptable					: _.uniq( children.map( child => otherFamilyConstellationConsiderations.indexOf( 'older children acceptable' ) !== -1 ) ),
			youngerChildrenAcceptable				: _.uniq( children.map( child => otherFamilyConstellationConsiderations.indexOf( 'younger children acceptable' ) !== -1 ) ),
			siblingToBePlacedWithCount				: children[ 0 ].siblingsToBePlacedWith.length,
			updatedAt								: _.uniq( children.map( child => child.updatedAt ) ),
			wednesdaysChild							: children.map( child => child.wednesdaysChild ).indexOf( true ) !== -1
		};
	});
}

exports.getChildDetails = ( req, res, next ) => {

	const childData = req.body;
	const registrationNumber = childData[ 'registrationNumber' ];

	/* TODO: fetch only the needed fields instead of grabbing everything */
	keystone.list( 'Child' ).model
		.findOne()
        .where( 'registrationNumber', registrationNumber )
        .populate( 'gender' )
        .exec()
        .then( child => {
			// create a valid embed string based on the youtube string provided
			const videoString = child.video && child.video.length > 0 ?
								child.video.replace( 'youtu.be', 'www.youtube.com/embed' ).replace( 'watch?v=', 'embed/' ) :
								undefined;
			// create a valid embed string based on the youtube string provided
			const wednesdaysChildVideoString = child.wednesdaysChildVideo && child.wednesdaysChildVideo.length > 0 ?
								child.wednesdaysChildVideo.replace( 'youtu.be', 'www.youtube.com/embed' ).replace( 'watch?v=', 'embed/' ) :
								undefined;

        	const relevantData = {
				hasImage				: _.isEmpty( child.image ) && child.image.url.length > 0,
				quote					: child.profile.quote,
        		profilePart1			: child.profile.part1,
        		profilePart2			: child.profile.part2,
        		profilePart3			: child.profile.part3,
        		video					: videoString,
				wednesdaysChildVideo	: wednesdaysChildVideoString
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

	/* TODO: fetch only the needed fields instead of grabbing everything */
	keystone.list( 'Child' ).model
		.findOne()
        .where( 'registrationNumber', registrationNumber )
        .populate( 'gender' )
        .exec()
        .then( child => {
			// create a valid embed string based on the youtube string provided
			const videoString = child.siblingGroupVideo && child.siblingGroupVideo.length > 0 ?
								child.siblingGroupVideo.replace( 'youtu.be', 'www.youtube.com/embed' ).replace( 'watch?v=', 'embed/' ) :
								undefined;
			// create a valid embed string based on the youtube string provided
			const wednesdaysChildVideoString = child.wednesdaysChildSiblingGroupVideo && child.wednesdaysChildSiblingGroupVideo.length > 0 ?
											   child.wednesdaysChildSiblingGroupVideo.replace( 'youtu.be', 'www.youtube.com/embed' ).replace( 'watch?v=', 'embed/' ) :
											   undefined;

			const relevantData = {
				hasImage				: _.isEmpty( child.siblingGroupImage ) && child.siblingGroupImage.url.length > 0,
				quote					: child.groupProfile.quote,
        		profilePart1			: child.groupProfile.part1,
        		profilePart2			: child.groupProfile.part2,
        		profilePart3			: child.groupProfile.part3,
        		video					: videoString,
				wednesdaysChildVideo	: wednesdaysChildVideoString
        	};

        	res.send( relevantData );

        }, err => {

			console.log( err );

			done();
		});
};
// TODO: this shouldn't return the id, but the entire model to be manipulated by the caller, as should all of these fetch functions
// TODO: this should be moved to the list service
exports.fetchChildStatusId = status => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Child Status' ).model
			.findOne()
			.where( 'childStatus', status )
			.exec()
			.then( status => {
				// if we found a child status matching the passed in text
				if( status ) {
					//resolve the promise with it's id
					resolve( status.get( '_id' ) )
				// if no matching child status was found
				} else {
					// TODO: consider throwing and new Error in these cases. This should be a system-wide change for better error handling and messaging
					// resolve the promise with undefined
					resolve( `could not find child status matching ${ status }` );
				}
			// if an error was encountered
			}, err => {
				// reject the promise with details of the error
				reject( `error fetching child status matching ${ status }` );
			});
	});
};

/* called when a social worker attempts to register a family */
exports.registerChild = ( req, res, next ) => {
	// store a reference to locals
	const locals = res.locals;
	// extract the child details submitted through the req object
	const rawChildData = req.body;
	// set the redirect path to navigate to after processing is complete
	const redirectPath = '/forms/social-worker-child-registration';
	// fetch the id for the active child status
	const fetchActiveChildStatusId = exports.fetchChildStatusId( 'active' );
	// if the active child status model has been
	fetchActiveChildStatusId
		.then( activeChildStatusId => {
			return exports.saveChild( rawChildData, activeChildStatusId );
		})
		// if the new child model was saved successfully
		.then( newChild => {
			// create a success flash message
			req.flash( 'success', {
					title: `Congratulations, the child you submitted has been successfully registered.`,
					detail: `Please note that it can take several days for the child's information to be reviewed.` } );
			// redirect the user back to the appropriate page
			res.redirect( 303, redirectPath );

			// get the database id of the social worker who submitted the form
			const socialWorkerId = req.user.get( '_id' );
			// store the registration number of the child who was created
			const childId = newChild.get( 'registrationNumber' );

			// set the fields to populate on the fetched child model
			const fieldsToPopulate = [ 'languages', 'gender', 'race', 'residence', 'city', 'legalStatus', 'status',
									   'recommendedFamilyConstellation', 'otherFamilyConstellationConsideration',
									   'disabilities' ];
			// set default information for a staff email contact in case the real contact info can't be fetched
			let staffEmailContactInfo = {
				name: { full: 'MARE' },
				email: 'web@mareinc.org'
			};

			// fetch the newly saved child model.  Needed because the saved child object doesn't have the Relationship fields populated
			const fetchChild = exports.getChildByRegistrationNumberNew( childId, fieldsToPopulate );
			// fetch the email target model matching 'social worker child registration'
			const fetchEmailTarget = emailTargetMiddleware.getEmailTargetByName( 'social worker child registration' );

			fetchEmailTarget
				// fetch contact info for the staff contact for 'social worker child registration'
				.then( emailTarget => staffEmailContactMiddleware.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
				// overwrite the default contact details with the returned object
				.then( staffEmailContact => staffEmailContactInfo = staffEmailContact.staffEmailContact )
				// log any errors fetching the staff email contact
				.catch( err => console.error( `error fetching email contact for social worker child registration, default contact info will be used instead - ${ err }` ) )
				// check on the attempt to fetch the newly saved child
				.then( () => fetchChild )
				// send a notification email to MARE
				.then( fetchedChild => {
					// send a notification email to MARE staff to allow them to enter the information in the old system
					// NOTE: both the form data and the newly saved child are passed in as both contain information that belongs in the email
					return socialWorkerChildRegistrationEmailService.sendNewSocialWorkerChildRegistrationNotificationEmailToMARE( rawChildData, fetchedChild, staffEmailContactInfo );
				})
				// if there was an error sending the email to MARE staff
				.catch( err => console.error( `error sending new child registered by social worker email to MARE staff - ${ err }` ) );

			fetchChild
				// send a notification email to the social worker
				// NOTE: both the form data and the newly saved child are passed in as both contain information that belongs in the email
				.then( fetchedChild => socialWorkerChildRegistrationEmailService.sendNewSocialWorkerChildRegistrationNotificationEmailToSocialWorker( rawChildData, fetchedChild, req.user.get( 'email' ), locals.host ) )
				// if there was an error sending the email to MARE staff
				.catch( err => console.error( `error sending new child registered by social worker email to social worker ${ req.user.name.full } - ${ err }` ) );
		})
		// if there was an error saving the new child record
		.catch( err => {
			// log the error for debugging purposes
			console.error( `error saving social worker registered child - ${ err }` );
			// create an error flash message
			req.flash( 'error', {
					title: `There was an error registering your child`,
					detail: `If this error persists, please notify MARE` } );
			// redirect the user to the appropriate page
			res.redirect( 303, locals.redirectPath );
		});
};

exports.saveChild = ( child, activeChildStatusId ) => {

	return new Promise( ( resolve, reject ) => {
		// create a new Child model
		const Child = keystone.list( 'Child' )

		const newChild = new Child.model({

			siteVisibility: 'only registered social workers and families',
			isVisibleInGallery: false,

			registeredBy					: 'unknown',
			registrationDate				: new Date(),

			name: {
				first						: child.firstName,
				last						: child.lastName,
				alias						: child.alias,
				nickName					: child.nickName
			},

			birthDate						: new Date( child.dateOfBirth ),
			languages						: child.languages,
			status							: activeChildStatusId,
			gender							: child.gender,
			race							: child.race,
			legalStatus						: child.legalStatus,
			yearEnteredCare					: child.yearEnteredCare,

			hasContactWithSiblings			: child.isSiblingContactNeeded.toLowerCase() === 'yes',
			siblingTypeOfContact			: child.siblingContactDescription,
			hasContactWithBirthFamily		: child.isFamilyContactNeeded.toLowerCase() === 'yes',
			birthFamilyTypeOfContact		: child.familyContactDescription,

			residence						: child.currentResidence,
			isOutsideMassachusetts			: child.isNotMACity,
			city							: child.isNotMACity ? undefined : child.city,
			cityText						: child.isNotMACity ? child.nonMACity : '',

			careFacilityName				: child.careFacility,

			physicalNeeds					: 'none',
			physicalNeedsDescription		: child.physicalNeeds,
			emotionalNeeds					: 'none',
			emotionalNeedsDescription		: child.emotionalNeeds,
			intellectualNeeds				: 'none',
			intellectualNeedsDescription	: child.intellectualNeeds,
			socialNeeds						: 'none',
			socialNeedsDescription			: child.socialNeeds,

			aspirations						: child.aspirations,

			schoolLife						: child.schoolLife,
			familyLife						: child.familyLife,
			personality						: child.personality,
			otherRecruitmentConsiderations	: child.otherRecruitmentConsiderations,

			disabilities					: child.disabilities,
			recommendedFamilyConstellation	: child.recommendedFamilyConstellations,
			otherFamilyConstellationConsideration: child.otherFamilyConstellationConsiderations
		});

		newChild.save( ( err, model ) => {
			// if there was an issue saving the new child
			if( err ) {
				// reject the promise with a descriptive message
				return reject( `error saving new child registered by social worker -  ${ err }` );
			}
			// resolve the promise with the newly saved child model
			resolve( model );
		});
	});
}

// ------------------------------------------------------------------------------------------ //

// TODO: these functions below are copies of functions above built with async.  They're rewritten with Promises
//		 and will replace the functions above once async has been removed

// ------------------------------------------------------------------------------------------ //

/* fetch a single child by their registration number */
exports.getChildByRegistrationNumberNew = ( registrationNumber, fieldsToPopulate = [] ) => {

	return new Promise( ( resolve, reject ) => {
		// convert the registration number to a number if it isn't already
		const targetRegistrationNumber = parseInt( registrationNumber, 10 );

		// if no registration number was passed in, or the number is invalid
		if( !registrationNumber
			|| ( typeof registrationNumber !== 'number' && typeof registrationNumber !== 'string' )
			|| ( typeof registrationNumber === 'number' && Number.isNaN( targetRegistrationNumber ) )
			|| ( typeof registrationNumber === 'string' && registrationNumber.length === 0 ) ) {
				// log an error for debugging purposes
				console.error( `the registration number was either not provided or invalid - number: ${ registrationNumber }` );
				// reject the promise
				reject();
		}
		// attempt to find a single child matching the passed in registration number
		keystone.list( 'Child' ).model
			.findOne()
			.where( 'registrationNumber' ).equals( targetRegistrationNumber )
			.populate( fieldsToPopulate )
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
		if( !registrationNumbers
			|| !Array.isArray( registrationNumbers )
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
		keystone.list( 'Child' ).model
			.find()
			.where( 'registrationNumber' ).in( targetRegistrationNumbers )
			.exec()
			.then( children => {
				// if the target child could not be found
				if( !children || children.length === 0 ) { // TODO: see if we need to check for existence
					// log an error for debugging purposes
					console.error( `no children matching registration numbers '${ registrationNumbers.join( ', ' ) } could be found` );
					// reject the promise
					return reject();
				}
				// if the target child was found, resolve the promise with the returned model
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

/* fetch a single child by their _id field */
exports.getChildById = ( { id, fieldsToPopulate = [] } ) => {
	return new Promise( ( resolve, reject ) => {
		// if no id was passed in
		if( !id ) {
			// reject the promise with details about the error
			reject( `no id provided` );
		}
		// attempt to find a single child matching the passed in registration number
		keystone.list( 'Child' ).model
			.findById( id )
			.populate( fieldsToPopulate )
			.exec()
			.then( child => {
				// if the target child could not be found
				if( !child ) {
					// reject the promise with details about the error
					return reject( `no child matching id '${ id } could be found` );
				}
				// if the target child was found, resolve the promise with the model
				resolve( child );
			// if there was an error fetching from the database
			}, err => {
				// reject the promise with details about the error
				reject( `error fetching child matching id ${ id } - ${ err }` );
			});
	});
};
