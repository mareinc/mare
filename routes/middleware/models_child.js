const keystone		= require( 'keystone' ),
	  _				= require( 'underscore' ),
	  childService	= require( './service_child' );

// wraps a model.save() operation in a Promise
function promisifySaveOperation( modelToSave ) {

	return new Promise( ( resolve, reject ) => {

		modelToSave.save( error => {

			if ( error ) {
				console.error( error );
			}

			resolve();
		});
	});
}

exports.batchAllSiblingUpdates = ( childModel ) => {

	return new Promise( ( resolve, reject ) => {

		const siblingsArrayBeforeSave				= childModel._original ? childModel._original.siblings.map( sibling => sibling.toString() ) : [], // this handles the model being saved for the first time
			  siblingsArrayAfterSave				= childModel.siblings.map( sibling => sibling.toString() ),
			  siblingsBeforeSave					= new Set( siblingsArrayBeforeSave ),
			  siblingsAfterSave						= new Set( siblingsArrayAfterSave ),
			  childId								= childModel._id.toString();

		// create an initial version of the set of records that will describe the final sibling group to save
		let siblingGroup = siblingsAfterSave;

		// create a set of all siblings added to the original child by the save operation
		let siblingsAddedBySave = siblingsBeforeSave.rightOuterJoin( siblingsAfterSave );

		// if there were no siblings added by the save operation
		if ( siblingsAddedBySave.size === 0 ) {
			// ensure that the sibling list is comprised of only unique entries
			childModel.siblings = Array.from( siblingsAfterSave );
			// return before doing any additional processing
			return resolve();
		}

		// add all of the siblings of the siblings that were added by the save operation
		childService
			// get the full model for any siblings that were added
			.getChildrenByIds( Array.from( siblingsAddedBySave ) )
			.then( addedChildren => {
				// loop through each of the child models
				addedChildren.forEach( child => {
					// get any siblings that are already defined for the child
					let addedChildSiblings = child.siblings.length > 0 ? child.siblings : undefined;
					// if there are any siblings already defined on the child model
					if ( addedChildSiblings ) {
						// add those siblings to the sibling group
						child.siblings.forEach( sibling => siblingGroup.add( sibling.toString() ) );
					}
				});
				// ensure that the child does not have itself listed in the sibling group
				siblingGroup.delete( childId );
				// create an array from the siblingGroup Set and set it as the saving child's siblings
				childModel.siblings = Array.from( siblingGroup );
				resolve();
			})
			// catch any errors
			.catch( error => {
				// log the error
				console.error( error );
				// reject the promise with the error
				reject( error );
			});
	});
};

exports.applySiblingGroupToChild = ( { childToUpdateId, siblingGroup = [] } ) => {

	return new Promise( ( resolve, reject ) => {

		childService
			.getChildById( { id: childToUpdateId } )
			.then( child => {

				// create a flag to determine if there are updates to the sibling group that need to be saved
				let saveUpdatesToSiblingGroup = false;

				// check to see if the current child is in the new sibling group
				let isCurrentChildInNewSiblingGroup = siblingGroup.includes( childToUpdateId );

				// if the current child is part of the new sibling group, update the child's current sibling group to the new sibling group
				if ( isCurrentChildInNewSiblingGroup ) {

					// get a representation of the child's current sibling group ( so it can be compared to the updated group )
					let currentSiblingGroup = child.siblings.map( sibling => sibling.toString() );

					// remove the current child's id from the updated sibling group ( it should not have a reference to itsels as a sibling )
					let siblingGroupWithoutCurrentChild = siblingGroup.filter( siblingId => siblingId !== childToUpdateId );

					// create sets from the siblings groups to leverage Set utilities to find differences
					let currentSiblingGroupSet = new Set( currentSiblingGroup );
					let updatedSiblingGroupSet = new Set( siblingGroupWithoutCurrentChild );

					// find any siblings that exist in the current sibling group but not the updated sibling group
					let exclusiveSiblingsInTheCurrentSet = currentSiblingGroupSet.leftOuterJoin( updatedSiblingGroupSet );

					// find any siblings that exist in the updated sibling group but not the current sibling group
					let exclusiveSiblingsInTheUpdatedSet = currentSiblingGroupSet.rightOuterJoin( updatedSiblingGroupSet );

					// if the current or updated sibling groups contain any differences
					if ( exclusiveSiblingsInTheCurrentSet.size > 0 || exclusiveSiblingsInTheUpdatedSet.size > 0 ) {
						// set the updated sibling group on the child model
						child.siblings = Array.from( updatedSiblingGroupSet );
						// set the save updates flag to true
						saveUpdatesToSiblingGroup = true;
					}

				// if the current child is not part of the new sibling group, reset the current child's sibling group to an empty group
				} else {

					// if the current child's sibling group is not already empty
					if ( child.siblings.length !== 0 ) {
						// reset the child's sibling group
						child.siblings = [];
						// set the save updates flag to true
						saveUpdatesToSiblingGroup = true;
					}
				}

				// if there are updates to be saved to the current child's sibling group
				if ( saveUpdatesToSiblingGroup ) {

					// disable future replication of fields to siblings ( this is presumably done to prevent siblings from updating eachother in an infinite loop )
					child._disableReplicateFieldsToSiblings = true;

					// save the updated child model
					child.save( error => {
						// log any errors
						if ( error ) {
							console.error( error );
						}
						// resolve the promise
						resolve( childToUpdateId );
					});
				} else {
					resolve( childToUpdateId );
				}
			})
			.catch( error => {
				// log the error
				console.error( error );
				// reject the promise with the error
				reject( childToUpdateId );
			});
	});
};

exports.removeSiblingFromChild = ( { childToUpdateId, siblingToRemoveId } ) => {

	return new Promise( ( resolve, reject ) => {

		childService
			.getChildById( { id: childToUpdateId } )
			.then( child => {

				// get an array of the current siblings on the child to update
				let siblings = child.siblings.map( sibling => sibling.toString() );
				// create a Set from the array
				let siblingSet = new Set( siblings );
				// store the size of the array before attempting to delete the sibling to remove
				let siblingSetSizeBeforeDelete = siblingSet.size;
				// delete the sibling to remove from the current sibling set
				siblingSet.delete( siblingToRemoveId );

				// if the size of the sibling set has changed after the delete action
				if ( siblingSetSizeBeforeDelete !== siblingSet.size ) {
					// update the child's sibling group
					child.siblings = Array.from( siblingSet );
					// disable future replication of fields to siblings ( this is presumably done to prevent siblings from updating eachother in an infinite loop )
					child._disableReplicateFieldsToSiblings = true;
					// save the updated child model
					child.save( error => {
						// log any errors\
						if ( error ) {
							console.error( error );
						}
						// resolve the promise
						resolve( childToUpdateId );
					});
				// if the size of the sibling set did not change after the delete action
				} else {
					// no update necessary - resolve the promise
					resolve( childToUpdateId );
				}
			})
			.catch( error => {
				// log the error
				console.error( error );
				// reject the promise with the error
				reject( childToUpdateId );
			});
	});
};

exports.batchAllSiblingsToBePlacedWithUpdates = ( childModel ) => {

	return new Promise( ( resolve, reject ) => {

		const siblingsToBePlacedWithArrayBeforeSave	= childModel._original ? childModel._original.siblingsToBePlacedWith.map( sibling => sibling.toString() ) : [],
			  siblingsToBePlacedWithArrayAfterSave	= childModel.siblingsToBePlacedWith.map( sibling => sibling.toString() ),
			  siblingsToBePlacedWithBeforeSave		= new Set( siblingsToBePlacedWithArrayBeforeSave ),
			  siblingsToBePlacedWithAfterSave		= new Set( siblingsToBePlacedWithArrayAfterSave ),
			  childId								= childModel._id.toString();

		// create an initial version of the set of record that will describe the final sibling group to save
		let siblingsToBePlacedWithGroup = siblingsToBePlacedWithAfterSave;

		// create a set of all siblings added to the original child by the save operation
		let siblingsToBePlacedWithAddedBySave = siblingsToBePlacedWithBeforeSave.rightOuterJoin( siblingsToBePlacedWithAfterSave );

		// if there were no siblings added by the save operation
		if ( siblingsToBePlacedWithAddedBySave.size === 0 ) {
			// ensure that the sibling list is still unique
			childModel.siblingsToBePlacedWith = Array.from( siblingsToBePlacedWithAfterSave );
			// return before doing any additional processing
			return resolve();
		}

		// add all of the siblings to be placed with of the siblings to be placed with that were added by the save operation
		childService
			// get the full model for any siblings to be placed with that were added
			.getChildrenByIds( Array.from( siblingsToBePlacedWithAddedBySave ) )
			.then( addedChildren => {
				// loop through each of the child models
				addedChildren.forEach( child => {
					// get any siblings to be placed with that are already defined for the child
					let addedChildSiblingsToBePlacedWith = child.siblingsToBePlacedWith.length > 0 ? child.siblingsToBePlacedWith : undefined;
					// if there are any siblings to be placed with already defined on the child model
					if ( addedChildSiblingsToBePlacedWith ) {
						// add those siblings to be placed with to the siblings to be placed with group
						child.siblingsToBePlacedWith.forEach( sibling => siblingsToBePlacedWithGroup.add( sibling.toString() ) );
					}
				});
				// ensure that the child does not have itself listed in the siblings to be placed with group
				siblingsToBePlacedWithGroup.delete( childId );
				// create an array from the siblingsToBePlacedWithGroup Set and set it as the saving child's siblings to be placed with
				childModel.siblingsToBePlacedWith = Array.from( siblingsToBePlacedWithGroup );
				resolve();
			})
			// catch any errors
			.catch( error => {
				// log the error
				console.error( error );
				// reject the promise with the error
				reject( error );
			});
	});
};

exports.applySiblingsToBePlacedWithGroupToChild = ( { childToUpdateId, recommendedFamilyConstellation = [], adoptionWorker = '', recruitmentWorker = '', isVisibleInGallery = false, siblingsToBePlacedWithGroup = [], siblingGroupProfile, siblingGroupImage, siblingGroupVideo, wednesdaysChildSiblingGroup, wednesdaysChildSiblingGroupDate, wednesdaysChildSiblingGroupVideo } ) => {

	return new Promise( ( resolve, reject ) => {

		// create a group profile object based on the saving child's profile information
		const newGroupQuote				= siblingGroupProfile.quote || '',
			  newGroupProfilePart1		= siblingGroupProfile.part1 || '',
			  newGroupProfilePart2		= siblingGroupProfile.part2 || '',
			  newGroupProfilePart3		= siblingGroupProfile.part3 || '',
			  newSiblingGroupImage		= siblingGroupImage || {};

		// get the child model to update
		childService
			.getChildById( { id: childToUpdateId } )
			.then( child => {

				const childsAdoptionWorker 		= child.adoptionWorker ? child.adoptionWorker.toString() : '',
					  childsRecruitmentWorker	= child.recruitmentWorker ? child.recruitmentWorker.toString() : '';

				// create a flag to determine if there are updates to the siblings to be placed with group that need to be saved
				let saveUpdatesToSiblingsToBePlacedWithGroup = false;
				// check to see if the current child is in the new siblings to be placed with group
				let isCurrentChildInNewSiblingsToBePlacedWithGroup = siblingsToBePlacedWithGroup.includes( childToUpdateId );
				// if the current child is part of the new siblings to be placed with group, update the child's current siblings to be placed with group to the new siblings to be placed with group
				if ( isCurrentChildInNewSiblingsToBePlacedWithGroup ) {
					// get a representation of the child's current siblings to be placed with group ( so it can be compared to the updated group )
					let currentSiblingsToBePlacedWithGroup = child.siblingsToBePlacedWith.map( sibling => sibling.toString() );
					// remove the current child's id from the updated siblings to be placed with group ( it should not have a reference to itsels as a sibling to be placed with )
					let siblingsToBePlacedWithGroupWithoutCurrentChild = siblingsToBePlacedWithGroup.filter( siblingId => siblingId !== childToUpdateId );
					// create sets from the siblings to be placed with groups to leverage Set utilities to find differences
					let currentSiblingsToBePlacedWithGroupSet = new Set( currentSiblingsToBePlacedWithGroup );
					let updatedSiblingsToBePlacedWithGroupSet = new Set( siblingsToBePlacedWithGroupWithoutCurrentChild );
					// find any siblings that exist in the current siblings to be placed with group but not the updated siblings to be placed with group
					let exclusiveSiblingsToBePlacedWithInTheCurrentSet = currentSiblingsToBePlacedWithGroupSet.leftOuterJoin( updatedSiblingsToBePlacedWithGroupSet );
					// find any siblings that exist in the updated siblings to be placed with group but not the current siblings to be placed with group
					let exclusiveSiblingsToBePlacedWithInTheUpdatedSet = currentSiblingsToBePlacedWithGroupSet.rightOuterJoin( updatedSiblingsToBePlacedWithGroupSet );
					// if the current or updated siblings to be placed with groups contain any differences
					if ( exclusiveSiblingsToBePlacedWithInTheCurrentSet.size > 0 || exclusiveSiblingsToBePlacedWithInTheUpdatedSet.size > 0 ) {
						// set the updated siblings to be placed with group on the child model
						child.siblingsToBePlacedWith = Array.from( updatedSiblingsToBePlacedWithGroupSet );
						// set the save updates flag to true
						saveUpdatesToSiblingsToBePlacedWithGroup = true;
					}

					// protect against items being undefined
					child.siblingGroupImage = child.siblingGroupImage || {};
					// test if wednesday's child group date has changed
					let hasWednesdaysChildSiblingGroupDateChanged = false;
					// try to cast both values to dates
					let currentwednesdaysChildSiblingGroupDate = child.wednesdaysChildSiblingGroupDate instanceof Date ? child.wednesdaysChildSiblingGroupDate : undefined;
					let newWednesdaysChildSiblingGroupDate = wednesdaysChildSiblingGroupDate instanceof Date ? wednesdaysChildSiblingGroupDate : undefined;
					// if both values are dates
					if ( currentwednesdaysChildSiblingGroupDate && newWednesdaysChildSiblingGroupDate ) {
						hasWednesdaysChildSiblingGroupDateChanged = currentwednesdaysChildSiblingGroupDate.toString() !== newWednesdaysChildSiblingGroupDate.toString();
					// if either value is not a date
					} else {
						hasWednesdaysChildSiblingGroupDateChanged = currentwednesdaysChildSiblingGroupDate != newWednesdaysChildSiblingGroupDate;
					}

					// test to see if any group profile attributes need to be updated
					// NOTE: this first check converts the _id arrays to strings, ensures both are sorted, then converts them into single strings for comparison
					// TODO: make a utility function for more readable array comparison
					if( child.recommendedFamilyConstellation.map( familyConstellation => familyConstellation.toString() ).sort().join( '' ) !== recommendedFamilyConstellation.map( familyConstellation => familyConstellation.toString() ).sort().join( '' ) ||
						childsAdoptionWorker !== adoptionWorker.toString() ||
						childsRecruitmentWorker !== recruitmentWorker.toString() ||
						child.isVisibleInGallery !== isVisibleInGallery ||
						child.groupProfile.quote !== siblingGroupProfile.quote ||
						child.groupProfile.part1 !== siblingGroupProfile.part1 ||
						child.groupProfile.part2 !== siblingGroupProfile.part2 ||
						child.groupProfile.part3 !== siblingGroupProfile.part3 ||
						child.siblingGroupImage.secure_url !== newSiblingGroupImage.secure_url || // when checking that the objects are different, we only need to test a single attribute
						child.siblingGroupVideo !== siblingGroupVideo ||
						child.wednesdaysChildSiblingGroup !== wednesdaysChildSiblingGroup ||
						hasWednesdaysChildSiblingGroupDateChanged ||
						child.wednesdaysChildSiblingGroupVideo !== wednesdaysChildSiblingGroupVideo ) {
							// update the child to be placed with with values that should replicate across records
							child.recommendedFamilyConstellation = recommendedFamilyConstellation;
							child.adoptionWorker = adoptionWorker ? adoptionWorker : undefined;
							child.recruitmentWorker = recruitmentWorker ? recruitmentWorker : undefined;
							child.isVisibleInGallery = isVisibleInGallery;
							// update the child to be placed with with the shared bio information
							child.groupProfile.quote	= newGroupQuote;
							child.groupProfile.part1   	= newGroupProfilePart1;
							child.groupProfile.part2	= newGroupProfilePart2;
							child.groupProfile.part3	= newGroupProfilePart3;
							// update the child to be placed with, with the group image and video
							child.siblingGroupImage     = Object.assign( {}, newSiblingGroupImage );
							child.siblingGroupVideo     = siblingGroupVideo;
							// update the group wednesday's child fields
							child.wednesdaysChildSiblingGroup       = wednesdaysChildSiblingGroup;
							child.wednesdaysChildSiblingGroupDate   = newWednesdaysChildSiblingGroupDate;
							child.wednesdaysChildSiblingGroupVideo  = wednesdaysChildSiblingGroupVideo;
							// set the save updates flag to true
							saveUpdatesToSiblingsToBePlacedWithGroup = true;
						}

				// if the current child is not part of the new siblings to be placed with group, reset the current child's siblings to be placed with group to an empty group
				} else {

					// if the current child's siblings to be placed with group is not already empty
					if ( child.siblingsToBePlacedWith.length !== 0 ) {
						// reset the child's siblings to be placed with group
						child.siblingsToBePlacedWith = [];
						// set the save updates flag to true
						saveUpdatesToSiblingsToBePlacedWithGroup = true;
					}
				}

				// if there are updates to be saved to the current child's siblings to be placed with group
				if ( saveUpdatesToSiblingsToBePlacedWithGroup ) {

					// save the updated child model
					child.save( error => {
						// log any errors
						if ( error ) {
							console.error( error );
						}
						// resolve the promise
						resolve();
					});
				} else {
					resolve();
				}
			})
			.catch( error => {
				// reject the promise with the error
				reject( error );
			});
	});
};

exports.removeSiblingToBePlacedWithFromChild = ( { childToUpdateId, siblingToBePlacedWithToRemoveId } ) => {

	return new Promise( ( resolve, reject ) => {

		childService
			.getChildById( { id: childToUpdateId } )
			.then( child => {

				// get an array of the current siblings to be placed with on the child to update
				let siblingsToBePlacedWith = child.siblingsToBePlacedWith.map( sibling => sibling.toString() );
				// create a Set from the array
				let siblingsToBePlacedWithSet = new Set( siblingsToBePlacedWith );
				// store the size of the array before attempting to delete the sibling to be placed with to remove
				let siblingsToBePlacedWithSetSizeBeforeDelete = siblingsToBePlacedWithSet.size;
				// delete the sibling to be placed with to remove from the current siblings to be placed with set
				siblingsToBePlacedWithSet.delete( siblingToBePlacedWithToRemoveId );

				// if the size of the siblings to be placed with set has changed after the delete action
				if ( siblingsToBePlacedWithSetSizeBeforeDelete !== siblingsToBePlacedWithSet.size ) {
					// update the child's siblings to be placed with group
					child.siblingsToBePlacedWith = Array.from( siblingsToBePlacedWithSet );
					// save the updated child model
					child.save( error => {
						// log any errors
						if ( error ) {
							console.error( error );
						}
						// resolve the promise
						resolve( childToUpdateId );
					});
				// if the size of the siblings to be placed with set did not change after the delete action
				} else {
					// no update necessary - resolve the promise
					resolve( childToUpdateId );
				}
			})
			.catch( error => {
				// log the error
				console.error( error );
				// reject the promise with the error
				reject( childToUpdateId );
			});
	});
};

/* updates sibling fields for chidren listed as siblings by adding missing entries */
exports.updateMySiblings = ( mySiblings, childId, done ) => {

	// TODO: change this and all Array.from(...) to use the ES6 spread operator
	// fetch all siblings who were added
	keystone.list( 'Child' ).model
		.find()
		.where( '_id' ).in( Array.from( mySiblings ) )
		.exec()
		.then( siblings => {
			// create an array to store all of the child model updates that need to be saved
			let childModelUpdates = [];
			// loop through each added sibling
			_.each( siblings, child => {
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
					// add the updated model to the list of child updates to be saved
					childModelUpdates.push( promisifySaveOperation( child ) );
				}
			});

			// execute all pending child model updates
			Promise
				.all( childModelUpdates )
				.then( () => {

					done();
				})
				.catch( error => {

					console.error( error );
					done();
				});
		// TODO: Update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
		}, ( err ) => {

			console.log( err );
			done();
		});
};
// TODO: childId isn't used in this function, as well as some below.  Remove them here as well as every place these functions are invoked
exports.updateMyRemainingSiblings = ( remainingSiblings, removedSiblings, childId, done ) => {

	// Fetch all siblings who remain after siblings have been removed from the target child ( childId )
	keystone.list( 'Child' ).model
		.find()
		.where( '_id' ).in( Array.from( remainingSiblings ) )
		.exec()
		.then( siblings => {
			// create an array to store all of the child model updates that need to be saved
			let childModelUpdates = [];
			// loop through each added sibling
			_.each( siblings, child => {
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
					// add the updated model to the list of child updates to be saved
					childModelUpdates.push( promisifySaveOperation( child ) );
				}
			});

			// execute all pending child model updates
			Promise
				.all( childModelUpdates )
				.then( () => {

					done();
				})
				.catch( error => {

					console.error( error );
					done();
				});
		// TODO: update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
		}, ( err ) => {

			console.log( err );
			done();
		});
};

exports.updateMyRemovedSiblings = ( allSiblings, removedSiblings, childId, done ) => {

	// fetch all siblings who were removed from the target child ( childId )
	keystone.list( 'Child' ).model
		.find()
		.where( '_id' ).in( Array.from( removedSiblings ) )
		.exec()
		.then( siblings => {
			// create an array to store all of the child model updates that need to be saved
			let childModelUpdates = [];
			// loop through each added sibling
			_.each( siblings, child => {
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
					// add the updated model to the list of child updates to be saved
					childModelUpdates.push( promisifySaveOperation( child ) );
				}
			});

			// execute all pending child model updates
			Promise
				.all( childModelUpdates )
				.then( () => {

					done();
				})
				.catch( error => {

					console.error( error );
					done();
				});
		// TODO: update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
		}, ( err ) => {

			console.log( err );
			done();
		});
};

/* updates sibling fields for chidren listed as siblings by adding missing entries */
exports.updateMySiblingsToBePlacedWith = ( mySiblings, childId, groupProfile, siblingGroupImage, siblingGroupVideo, wednesdaysChildSiblingGroup, wednesdaysChildSiblingGroupDate, wednesdaysChildSiblingGroupVideo, done ) => {

	// create the group profile object based on what was passed in
	const newGroupProfile		= groupProfile || {},
		  newGroupQuote			= groupProfile.quote || '',
		  newGroupProfilePart1	= groupProfile.part1 || '',
		  newGroupProfilePart2	= groupProfile.part2 || '',
		  newGroupProfilePart3	= groupProfile.part3 || '';

	// fetch all siblings who were added
	keystone.list( 'Child' ).model
		.find()
		.where( '_id' ).in( Array.from( mySiblings ) )
		.exec()
		.then( siblings => {
			// create an array to store all of the child model updates that need to be saved
			let childModelUpdates = [];
			// loop through each added sibling
			_.each( siblings, child => {
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
					child.groupProfile.quote !== groupProfile.quote ||
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
					child.groupProfile.quote	= newGroupQuote;
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
					// add the updated model to the list of child updates to be saved
					childModelUpdates.push( promisifySaveOperation( child ) );
				}
			});

			// execute all pending child model updates
			Promise
				.all( childModelUpdates )
				.then( () => {

					done();
				})
				.catch( error => {

					console.error( error );
					done();
				});
		// TODO: update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
		}, ( err ) => {

			console.log( err );
			done();
		});
};

exports.updateMyRemainingSiblingsToBePlacedWith = ( remainingSiblings, removedSiblings, childId, done ) => {

	// fetch all siblings who remain after siblings have been removed from the target child ( childId )
	keystone.list( 'Child' ).model
		.find()
		.where( '_id' ).in( Array.from( remainingSiblings ) )
		.exec()
		.then( siblings => {
			// create an array to store all of the child model updates that need to be saved
			let childModelUpdates = [];
			// loop through each added sibling
			_.each( siblings, child => {
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
					// add the updated model to the list of child updates to be saved
					childModelUpdates.push( promisifySaveOperation( child ) );
				}
			});

			// execute all pending child model updates
			Promise
				.all( childModelUpdates )
				.then( () => {

					done();
				})
				.catch( error => {

					console.error( error );
					done();
				});
		// TODO: update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
		}, ( err ) => {

			console.log( err );
			done();
		});
};

exports.updateMyRemovedSiblingsToBePlacedWith = ( allSiblings, removedSiblings, childId, done ) => {

	// fetch all siblings who were removed from the target child ( childId )
	keystone.list( 'Child' ).model
		.find()
		.where( '_id' ).in( Array.from( removedSiblings ) )
		.exec()
		.then( siblings => {
			// create an array to store all of the child model updates that need to be saved
			let childModelUpdates = [];
			// loop through each added sibling
			_.each( siblings, child => {
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
					// add the updated model to the list of child updates to be saved
					childModelUpdates.push( promisifySaveOperation( child ) );
				}
			});

			// execute all pending child model updates
			Promise
				.all( childModelUpdates )
				.then( () => {

					done();
				})
				.catch( error => {

					console.error( error );
					done();
				});
		// TODO: update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
		}, ( err ) => {

			console.log( err );
			done();
		});
};

exports.updateBookmarksToRemoveByStatus = ( statusId, bookmarkedChildrenToRemove, childId, done ) => {

	keystone.list( 'Child Status' ).model
		.findById( statusId )
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
