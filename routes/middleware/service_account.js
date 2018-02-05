// TODO: this is a big one.  Review all middleware and come up with a better division of labor.  All email sending in email_ middleware
//		 but we might want to find a better separation of concerns for fetching model data, modifying models, and utility functions to make
//		 all these middleware files more readable and maintainable.  This involves a review of every middleware function.

// TODO: a lot of this functionality is needed for social worker child/family registration and should potentially be broken out and placed in more
//		 appropriate files

const keystone 		= require( 'keystone' ),
	  _				= require( 'lodash' ),
	  userService	= require( './service_user' );

exports.updateUser = ( req, res, next ) => {
	const updates	= req.body,
		  userType	= req.user.userType,
		  userId	= req.user.get( '_id' );

	// get the model corresponding to the type of user making the request
	const model = userService.getTargetModel( userType );

	// fetch the users record using the id parameter passed in with the request
	let fetchUser = userService.getUserByIdNew( userId, model );

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
					res.send({ status: 'error' });
				} else {
					res.send({ status: 'success' });
				}


			});
		} else {

			// log the error
			console.error( `there were no updates to save to ${ userType } ${ user._id }` );
			// send an emtpy response
			res.send({ status: 'error' });
		}
	})
	.catch( () => {
		// log the error for debugging purposes
		console.error( `there was an error updating details for user with id ${ userId }` );
		// send an empty response back to the user
		res.send({ status: 'error' });
	});
}
