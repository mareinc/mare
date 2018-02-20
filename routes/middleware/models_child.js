const keystone		= require( 'keystone' ),
	  _				= require( 'underscore' ),
	  async			= require( 'async' ),
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

		console.log( `updating siblings for child: ${ childModel.name.first } ${ childModel.name.last }` );

		const siblingsArrayBeforeSave				= childModel._original ? childModel._original.siblings.map( sibling => sibling.toString() ) : [], // this handles the model being saved for the first time
			  siblingsArrayAfterSave				= childModel.siblings.map( sibling => sibling.toString() ),
			  siblingsToBePlacedWithArrayBeforeSave	= childModel._original ? childModel._original.siblingsToBePlacedWith.map( sibling => sibling.toString() ) : [],
			  siblingsToBePlacedWithArrayAfterSave	= childModel.siblingsToBePlacedWith.map( sibling => sibling.toString() ),

			  siblingsBeforeSave					= new Set( siblingsArrayBeforeSave ),
			  siblingsAfterSave						= new Set( siblingsArrayAfterSave ),
			  siblingsToBePlacedWithBeforeSave		= new Set( siblingsToBePlacedWithArrayBeforeSave ),
			  siblingsToBePlacedWithAfterSave		= new Set( siblingsToBePlacedWithArrayAfterSave ),

			  childId								= childModel._id.toString();

		console.log( `siblings before save ${ Array.from( siblingsBeforeSave ) }` );
		console.log( `siblings after save ${ Array.from( siblingsAfterSave ) }` );

		// create an initial version of the set of record that will describe the final sibling group to save
		let siblingGroup = siblingsAfterSave;

		// create a set of all siblings added to the original child by the save operation
		let siblingsAddedBySave = siblingsBeforeSave.rightOuterJoin( siblingsAfterSave );

		// if there were no siblings added by the save operation
		if ( siblingsAddedBySave.size === 0 ) {
			// ensure that the sibling list is still unique
			childModel.siblings = Array.from( siblingsAfterSave );
			// return before doing any additional processing
			console.log( 'no siblings added - additional pre-save processing is not required' );
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
				console.log( `final sibling group ${ childModel.siblings }` );
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

exports.updateSiblingsOfChild = ( { siblingToAddID, siblingsToRemoveIDs = [], childToUpdateID } ) => {

	return new Promise( ( resolve, reject ) => {

		childService
			.getChildById( { id: childToUpdateID } )
			.then( child => {

				let currentSiblings = child.siblings.map( sibling => sibling.toString() );
				let allSiblings = currentSiblings.push( siblingToAddID );
				let filteredSiblings = allSiblings.filter( sibling => !siblingsToRemoveIDs.includes( sibling ) );
				let newSiblings =  Array.from( new Set( filteredSiblings ) );

				let siblingsDirty = false;

				newSiblings.forEach( sibling => {

					if ( !currentSiblings.includes( sibling ) ) {
						siblingsDirty = true;
					}
				});

				if ( siblingsDirty ) {

					child.siblings = newSiblings;

					child.save( error => {

						if ( error ) {
							console.error( error );
						}

						resolve();
					});
				} else {
					resolve();
				}


			})
			.catch( error => {
				// log the error
				console.error( error );
				// reject the promise with the error
				reject( error );
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
