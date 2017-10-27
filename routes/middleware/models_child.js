const keystone 	            	= require( 'keystone' ),
	  _			            	= require( 'underscore' ),
	  async		            	= require( 'async' ),
	  socialWorkerMiddleware	= require( './service_social-worker' ),
	  agencyMiddleware			= require( './service_agency' );

/* takes in an array of child ids and returns an array of their registration numbers */
exports.getRegistrationNumbersById = ( idsArray, registrationNumbersArray, done ) => {

	keystone.list( 'Child' ).model.find()
			.where( '_id' ).in( idsArray )
			.exec()
			.then( children => {

				for( child of children ) {
					registrationNumbersArray.push( child.get( 'registrationNumber' ) );
				};

				done();
			}, err => {

				console.log( err );

				done();
			});
};

/* takes in an array of child ids and returns an array of their first names */
exports.getFirstNamesById = ( idsArray, namesArray, done ) => {

	keystone.list( 'Child' ).model.find()
			.where( '_id' ).in( idsArray )
			.exec()
			.then( children => {

				for( child of children ) {
					namesArray.push( child.name.first );
				};

				done();
			}, err => {

				console.log( err );

				done();
			});
};

/* updates sibling fields for chidren listed as siblings by adding missing entries */
exports.updateMySiblings = ( mySiblings, childId, done ) => {

	// TODO: change this and all Array.from(...) to use the ES6 spread operator
	// fetch all siblings who were added
	keystone.list( 'Child' ).model.find()
			.where( '_id' ).in( Array.from( mySiblings ) )
			.exec()
			.then( ( siblings ) => {

				// loop through each added sibling
				_.each( siblings, ( child ) => {
					// store the childs current sibling as an array of strings
					const currentSiblingsArray = child.siblings ? child.siblings.map( sibling => sibling.toString() ) : [];
					// convert the array to a set
					const currentSiblings = new Set( currentSiblingsArray );
					// get the id of the current child in the loop we need to update
					const targetChildId = child.get('_id').toString();
					// copy the original siblings into a set to prevent changes from affecting mySiblings, and to prevent duplicates
					let newSiblings = new Set( [ ...mySiblings ] );
					// add the current child in the loop to the set
					newSiblings.add( childId );
					// remove the current child in the loop because we don't want to add him/her as a sibling of himself/herself
					newSiblings.delete( targetChildId );       
					// create a set of the siblings to add, derived from looking at which siblings are already included
					const siblingsToAdd = currentSiblings.rightOuterJoin( newSiblings );
					// if there are siblings to add to the child
					if( siblingsToAdd.size > 0 ) {
						// add any new siblings to the child
						child.siblings.push( ...siblingsToAdd );
						// save the child
						child.save();
					}
				});

				done();
			// TODO: Update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
			}, ( err ) => {

				console.log( err );
				done();
			});
};
// TODO: childId isn't used in this function, as well as some below.  Remove them here as well as every place these functions are invoked
exports.updateMyRemainingSiblings = ( remainingSiblings, removedSiblings, childId, done ) => {

	// Fetch all siblings who remain after siblings have been removed from the target child ( childId )
	keystone.list( 'Child' ).model.find()
			.where( '_id' ).in( Array.from( remainingSiblings ) )
			.exec()
			.then( ( siblings ) => {
				// loop through each added sibling
				_.each( siblings, ( child ) => {
					const targetChildId = child.get('_id').toString();
					// store the childs current sibling as an array of strings
					const currentSiblingsArray = child.siblings ? child.siblings.map( sibling => sibling.toString() ) : [];
					// convert the array to a set
					const currentSiblings = new Set( currentSiblingsArray );    
					// create a set of the siblings to add, derived from looking at which siblings are already included
					const siblingsToRemove = currentSiblings.intersection( removedSiblings );
					// if the child has any siblings
					if( siblingsToRemove.size > 0 ) {
						// create a set of the remaining siblings after removing the children who don't belong
						const remainingChildren = currentSiblings.leftOuterJoin( siblingsToRemove );
						// remove all siblings from the child
						child.siblings = [ ...remainingChildren ];
						// save the child
						child.save();
					}
				});

				done();
			// TODO: update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
			}, ( err ) => {

				console.log( err );
				done();
			});
};

exports.updateMyRemovedSiblings = ( allSiblings, removedSiblings, childId, done ) => {

	// fetch all siblings who were removed from the target child ( childId )
	keystone.list( 'Child' ).model.find()
			.where( '_id' ).in( Array.from( removedSiblings ) )
			.exec()
			.then( ( siblings ) => {
				// loop through each added sibling
				_.each( siblings, ( child ) => {
					// store the childs current sibling as an array of strings
					const currentSiblingsArray = child.siblings ? child.siblings.map( sibling => sibling.toString() ) : [];
					// convert the array to a set
					const currentSiblings = new Set( currentSiblingsArray );
					// get the id of the current child in the loop we need to update
					const targetChildId = child.get('_id').toString();
					// copy the original siblings into a set to prevent changes from affecting removedSiblings, and to prevent duplicates
					let deletedSiblings = new Set( [ ...allSiblings ] );
					// add the current child in the loop to the set
					deletedSiblings.add( childId );
					// remove the current child in the loop because we don't want to add him/her as a sibling of himself/herself
					deletedSiblings.delete( targetChildId );       
					// create a set of the siblings to add, derived from looking at which siblings are already included
					const siblingsToRemove = currentSiblings.intersection( deletedSiblings );
					// if the child has any siblings
					if( siblingsToRemove.size > 0 ) {
						// create a set of the remaining siblings after removing the children who don't belong
						const remainingChildren = currentSiblings.leftOuterJoin( siblingsToRemove );
						// remove all siblings from the child
						child.siblings = [ ...remainingChildren ];
						// save the child
						child.save();
					}
				});

				done();
			// TODO: update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
			}, ( err ) => {

				console.log( err );
				done();
			});
};

/* updates sibling fields for chidren listed as siblings by adding missing entries */
exports.updateMySiblingsToBePlacedWith = ( mySiblings, childId, groupProfile, siblingGroupImage, siblingGroupVideo, wednesdaysChildSiblingGroup, wednesdaysChildSiblingGroupDate, wednesdaysChildSiblingGroupVideo, done ) => {

	// create the group profile object based on what was passed in
	const newGroupProfile = groupProfile || {};
	const newGroupProfilePart1 = groupProfile.part1 || '';
	const newGroupProfilePart2 = groupProfile.part2 || '';
	const newGroupProfilePart3 = groupProfile.part3 || '';

	// fetch all siblings who were added
	keystone.list( 'Child' ).model.find()
			.where( '_id' ).in( Array.from( mySiblings ) )
			.exec()
			.then( ( siblings ) => {

				// loop through each added sibling
				_.each( siblings, ( child ) => {
					// store the childs current sibling as an array of strings
					const currentSiblingsArray = child.siblingsToBePlacedWith ? child.siblingsToBePlacedWith.map( sibling => sibling.toString() ) : [];
					// convert the array to a set
					const currentSiblings = new Set( currentSiblingsArray );
					// get the id of the current child in the loop we need to update
					const targetChildId = child.get('_id').toString();
					// copy the original siblings into a set to prevent changes from affecting mySiblings, and to prevent duplicates
					let newSiblings = new Set( [ ...mySiblings ] );
					// add the current child in the loop to the set
					newSiblings.add( childId );
					// remove the current child in the loop because we don't want to add him/her as a sibling of himself/herself
					newSiblings.delete( targetChildId );       
					// create a set of the siblings to add, derived from looking at which siblings are already included
					const siblingsToAdd = currentSiblings.rightOuterJoin( newSiblings );
					// ensures that the group profile object exists
					child.groupProfile = child.groupProfile || {};
					// if there are siblings to add to the child or any shared sibling group data fields have changed
					if( siblingsToAdd.size > 0 ||
						child.groupProfile.part1 !== groupProfile.part1 ||
						child.groupProfile.part2 !== groupProfile.part2 ||
						child.groupProfile.part3 !== groupProfile.part3 ||
						child.siblingGroupImage.secure_url !== siblingGroupImage.secure_url || // when checking that the objects are different, we only need to test a single attribute
						child.siblingGroupVideo !== siblingGroupVideo ||
						child.wednesdaysChildSiblingGroup !== wednesdaysChildSiblingGroup ||
						child.wednesdaysChildSiblingGroupDate.toString() !== wednesdaysChildSiblingGroupDate.toString() ||
						child.wednesdaysChildSiblingGroupVideo !== wednesdaysChildSiblingGroupVideo ) {
						// TODO: possibly simplify this with an Object.assign
						// update the child to be placed with with the shared bio information
						child.groupProfile.part1   	= newGroupProfilePart1;
						child.groupProfile.part2	= newGroupProfilePart2;
						child.groupProfile.part3	= newGroupProfilePart3;
						// update the child to be placed with, with the group image and video
						child.siblingGroupImage     = Object.assign( {}, siblingGroupImage );
						child.siblingGroupVideo     = siblingGroupVideo;
						// update the group wednesday's child fields
						child.wednesdaysChildSiblingGroup       = wednesdaysChildSiblingGroup;
						child.wednesdaysChildSiblingGroupDate   = wednesdaysChildSiblingGroupDate;
						child.wednesdaysChildSiblingGroupVideo  = wednesdaysChildSiblingGroupVideo;
						// add any new siblings to the child
						child.siblingsToBePlacedWith.push( ...siblingsToAdd );
						// save the child
						child.save();
					}
				});

				done();
			// TODO: update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
			}, ( err ) => {

				console.log( err );
				done();
			});
};

exports.updateMyRemainingSiblingsToBePlacedWith = ( remainingSiblings, removedSiblings, childId, done ) => {

	// fetch all siblings who remain after siblings have been removed from the target child ( childId )
	keystone.list( 'Child' ).model.find()
			.where( '_id' ).in( Array.from( remainingSiblings ) )
			.exec()
			.then( ( siblings ) => {
				// loop through each added sibling
				_.each( siblings, ( child ) => {
					const targetChildId = child.get('_id').toString();
					// store the childs current sibling as an array of strings
					const currentSiblingsArray = child.siblingsToBePlacedWith ? child.siblingsToBePlacedWith.map( sibling => sibling.toString() ) : [];
					// convert the array to a set
					const currentSiblings = new Set( currentSiblingsArray );    
					// create a set of the siblings to add, derived from looking at which siblings are already included
					const siblingsToRemove = currentSiblings.intersection( removedSiblings );
					// if the child has any siblings
					if( siblingsToRemove.size > 0 ) {
						// create a set of the remaining siblings after removing the children who don't belong
						const remainingChildren = currentSiblings.leftOuterJoin( siblingsToRemove );
						// remove all siblings from the child
						child.siblingsToBePlacedWith = [ ...remainingChildren ];
						// save the child
						child.save();
					}
				});

				done();
			// TODO: update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
			}, ( err ) => {

				console.log( err );
				done();
			});
};

exports.updateMyRemovedSiblingsToBePlacedWith = ( allSiblings, removedSiblings, childId, done ) => {

	// fetch all siblings who were removed from the target child ( childId )
	keystone.list( 'Child' ).model.find()
			.where( '_id' ).in( Array.from( removedSiblings ) )
			.exec()
			.then( ( siblings ) => {
				// loop through each added sibling
				_.each( siblings, ( child ) => {
					// store the childs current sibling as an array of strings
					const currentSiblingsArray = child.siblingsToBePlacedWith ? child.siblingsToBePlacedWith.map( sibling => sibling.toString() ) : [];
					// convert the array to a set
					const currentSiblings = new Set( currentSiblingsArray );
					// get the id of the current child in the loop we need to update
					const targetChildId = child.get('_id').toString();
					// copy the original siblings into a set to prevent changes from affecting removedSiblings, and to prevent duplicates
					let deletedSiblings = new Set( [ ...allSiblings ] );
					// add the current child in the loop to the set
					deletedSiblings.add( childId );
					// remove the current child in the loop because we don't want to add him/her as a sibling of himself/herself
					deletedSiblings.delete( targetChildId );       
					// create a set of the siblings to add, derived from looking at which siblings are already included
					const siblingsToRemove = currentSiblings.intersection( deletedSiblings );
					// if the child has any siblings
					if( siblingsToRemove.size > 0 ) {
						// create a set of the remaining siblings after removing the children who don't belong
						const remainingChildren = currentSiblings.leftOuterJoin( siblingsToRemove );
						// remove all siblings from the child
						child.siblingsToBePlacedWith = [ ...remainingChildren ];
						// save the child
						child.save();
					}
				});

				done();
			// TODO: update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
			}, ( err ) => {

				console.log( err );
				done();
			});
};

exports.updateBookmarksToRemoveByStatus = ( statusId, bookmarkedChildrenToRemove, childId, done ) => {

	keystone.list('Child Status').model.findById( statusId )
			.exec()
			.then( status => {

				if( status.childStatus !== 'active' ) {
					bookmarkedChildrenToRemove.push( childId );
				}

				done();

			}, err => {

				console.log( err );

				done();
			});	
}
// TODO: this implementation is ugly, it needs to be rewritten in a non-crappy way
exports.setAgencyFields = ( child, done ) => {

	let models = {};

	async.series([
		done => { socialWorkerMiddleware.getSocialWorkerById( child.adoptionWorker, models, 'adoptionWorker', done ); },
		done => { socialWorkerMiddleware.getSocialWorkerById( child.recruitmentWorker, models, 'recruitmentWorker', done ); },
		done => { models.adoptionWorker ? agencyMiddleware.getAgencyById( models.adoptionWorker.agency, models, 'adoptionWorkerAgency', done ) : done(); },
		done => { models.recruitmentWorker ? agencyMiddleware.getAgencyById( models.recruitmentWorker.agency, models, 'recruitmentWorkerAgency', done ) : done(); }
	], () => {

		if( models.adoptionWorkerAgency ) {
			child.adoptionWorkerAgency = models.adoptionWorkerAgency.get( '_id' );
			child.adoptionWorkerAgencyRegion = models.adoptionWorkerAgency.address.region;
		} else {
			child.adoptionWorkerAgency = undefined;
			child.adoptionWorkerAgencyRegion = undefined;
		}
		
		if( models.recruitmentWorkerAgency ) {
			child.recruitmentWorkerAgency = models.recruitmentWorkerAgency.get( '_id' );
			child.recruitmentWorkerAgencyRegion = models.recruitmentWorkerAgency.address.region;
		} else {
			child.recruitmentWorkerAgency = undefined;
			child.recruitmentWorkerAgencyRegion = undefined;
		}

		done();
	});
}