// TODO: this is a big one.  Review all middleware and come up with a better division of labor.  All email sending in email_ middleware
//		 but we might want to find a better separation of concerns for fetching model data, modifying models, and utility functions to make
//		 all these middleware files more readable and maintainable.  This involves a review of every middleware function.

// TODO: a lot of this functionality is needed for social worker child/family registration and should potentially be broken out and placed in more
//		 appropriate files

const _						= require( 'lodash' ),
	  userService			= require( './service_user' ),
	  flashMessages			= require( './service_flash-messages' ),
	  mailingListService	= require( './service_mailing-list' );

exports.updateUser = ( req, res, next ) => {
	const updates	= req.body,
		  userType	= req.user.userType,
		  userId	= req.user.get( '_id' );

	// get the model corresponding to the type of user making the request
	const model = userService.getTargetModel( userType );

	// fetch the users record using the id parameter passed in with the request
	let fetchUser = userService.getUserByIdNew( { id: userId, targetModel: model } );

	// once we've fetched the user model
	fetchUser.then( user => {

		// gets a complete representation of the user model ( including all field definitions, regardless of if they are set or not )
		let userModelComplete = user._;

		for ( updateFieldPath in updates ) {

			// attempts to retrive a field definition from the current user model at a given path - e.g. 'type' or 'name.first'
			let fieldDefinition = _.get( userModelComplete, updateFieldPath );

			if ( fieldDefinition ) {

				// check for special case to set a field to undefined ( i.e. unset the field )
				// cannot pass undefined values in a POST request, so we need this workaround
				if ( updates[ updateFieldPath ] === '_undefined' ) {
					updates[ updateFieldPath ] = undefined;
				}

				// if the fieldDefinition exists, set the updated value on the user model
				user.set( updateFieldPath, updates[ updateFieldPath ] );
			} else {

				// otherwise log an error that an invalid field is attempting to be updated
				console.warn( `warning - attempting to set a non-existent field ${ updateFieldPath } on a ${ userType } model with id ${ user._id }` );
			}
		}

		// check to see if the any updates have been applied to the user model
		if ( user.isModified() ) {

			// if so, save the updated user model
			user.save( error => {

				if ( error ) {

					// log any errors
					console.error( `there was an error saving an update to ${ userType } ${ user._id } : ${ error }` );
					// create an error flash message to send back to the user
					flashMessages.appendFlashMessage({
						messageType: flashMessages.MESSAGE_TYPES.ERROR,
						title: 'There was an error updating your account',
						message: 'If this error persists, please contact MARE for assistance'
					});
					// send the error status and flash message markup
					flashMessages.generateFlashMessageMarkup()
						.then( flashMessageMarkup => {
							res.send({
								status: 'error',
								flashMessage: flashMessageMarkup
							});
						});
				} else {

					// create an error flash message to send back to the user
					flashMessages.appendFlashMessage({
						messageType: flashMessages.MESSAGE_TYPES.SUCCESS,
						title: 'Your account was updated succesfully'
					});
					// send the error status and flash message markup
					flashMessages.generateFlashMessageMarkup()
						.then( flashMessageMarkup => {
							res.send({
								status: 'success',
								flashMessage: flashMessageMarkup
							});
						});
				}
			});
		} else {

			// log the error
			console.error( `there were no updates to save to ${ userType } ${ user._id }` );
			// create an error flash message to send back to the user
			flashMessages.appendFlashMessage({
				messageType: flashMessages.MESSAGE_TYPES.ERROR,
				title: 'There was an error updating your account',
				message: 'If this error persists, please contact MARE for assistance'
			});
			// send the error status and flash message markup
			flashMessages.generateFlashMessageMarkup()
				.then( flashMessageMarkup => {
					res.send({
						status: 'error',
						flashMessage: flashMessageMarkup
					});
				});
		}
	})
	.catch( () => {
		// log the error for debugging purposes
		console.error( `there was an error updating details for user with id ${ userId }` );
		// create an error flash message to send back to the user
		flashMessages.appendFlashMessage({
			messageType: flashMessages.MESSAGE_TYPES.ERROR,
			title: 'There was an error updating your account',
			message: 'If this error persists, please contact MARE for assistance'
		});
		// send the error status and flash message markup
		flashMessages.generateFlashMessageMarkup()
			.then( flashMessageMarkup => {
				res.send({
					status: 'error',
					flashMessage: flashMessageMarkup
				});
			});
	});
}

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

exports.updateUserEmailLists = ( req, res, next ) => {
	const updates	= req.body,
		  userType	= req.user.userType,
		  userId	= req.user.get( '_id' );

	mailingListService.getRegistrationMailingLists()
		.then( mailingLists => {
			let updatedEmailListIds = typeof updates.emailLists !== 'undefined' ? updates.emailLists : [];
			let userIdString = userId.toString();
			let mailingListModelUpdates = [];
			
			for ( let mailingList of mailingLists ) {
				let mailingListId = mailingList._id.toString();
				let subscribers;
				
				switch ( req.user.userType ) {
					case 'admin':
						subscribers = mailingList.adminSubscribers;
						break;
					case 'social worker':
						subscribers = mailingList.socialWorkerSubscribers;
						break;
					case 'site visitor':
						subscribers = mailingList.siteVisitorSubscribers;
						break;
					case 'family':
						subscribers = mailingList.familySubscribers;
						break;
				}
				
				// if the user type is not supported
				if ( typeof subscribers === 'undefined' ) {
					continue;
				}
				
				let isModified = false;
				let subscriberIds = subscribers.map( subscriber => subscriber.toString() );
				
				// add to the list
				if ( ! subscriberIds.includes( userIdString ) && updatedEmailListIds.includes( mailingListId ) ) {
					// append the user to subscribers array without the mutation
					subscribers.splice( 0, subscribers.length, ...subscribers.concat( [ userId ] ) );
					isModified = true;
				}
				
				// remove from the list
				if ( subscriberIds.includes( userIdString ) && ! updatedEmailListIds.includes( mailingListId ) ) {
					let index = subscribers.findIndex( subscriber => subscriber.toString() === userIdString );
					// remove the user from subscribers array without the mutation
					subscribers.splice( index, 1 );
					isModified = true;
				}
				
				// add the mailing list to the updates
				if ( isModified ) {
					mailingListModelUpdates.push( new Promise( ( resolve, reject ) => {
							mailingList.save( error => {
								if ( error ) {
									console.error( error );
									reject();
								}
								resolve();
							});
						})
					);
				}
			}
			
			// save all changed models
			Promise
				.all( mailingListModelUpdates )
				.then( () => {
					// create an error flash message to send back to the user
					flashMessages.appendFlashMessage({
						messageType: flashMessages.MESSAGE_TYPES.SUCCESS,
						title: 'Your e-mail lists were updated succesfully'
					});
					// send the error status and flash message markup
					flashMessages.generateFlashMessageMarkup()
						.then( flashMessageMarkup => {
							res.send({
								status: 'success',
								flashMessage: flashMessageMarkup
							});
						});;
				})
				.catch( error => {
					// log an error for debugging purposes
					console.error( `there was an error saving e-mail lists of ${ userType } ${ userId } : ${ error }` );
					
					// create an error flash message to send back to the user
					flashMessages.appendFlashMessage({
						messageType: flashMessages.MESSAGE_TYPES.ERROR,
						title: 'There was an error updating your e-mail lists',
						message: 'If this error persists, please contact MARE for assistance'
					});
					// send the error status and flash message markup
					flashMessages.generateFlashMessageMarkup()
						.then( flashMessageMarkup => {
							res.send({
								status: 'error',
								flashMessage: flashMessageMarkup
							});
						});
				});
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading e-mail lists${ err }` );
			
			// create an error flash message to send back to the user
			flashMessages.appendFlashMessage({
				messageType: flashMessages.MESSAGE_TYPES.ERROR,
				title: 'There was an error updating your e-mail lists',
				message: 'If this error persists, please contact MARE for assistance'
			});
			// send the error status and flash message markup
			flashMessages.generateFlashMessageMarkup()
				.then( flashMessageMarkup => {
					res.send({
						status: 'error',
						flashMessage: flashMessageMarkup
					});
				});
		});
}
