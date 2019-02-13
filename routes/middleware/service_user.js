const keystone = require('keystone'),
	  User	   = require('../../models/User');

/* root through the passed in options and get/set the necessary information on res.locals for processing by each service request */
exports.exposeGlobalOptions = function exposeGlobalOptions( req, res, options ) {

	res.locals.targetModel = exports.getTargetModel( options.userType );

};
/* we're using one generic function to capture data for all user types.  This requires a user to pass in a userType
   in an options object in order to fetch anything but base Users */
exports.getTargetModel = userType => {

	let targetModel;

	switch( userType ) {
		case 'Admin'			: targetModel = keystone.list( 'Admin' ); break;
		case 'Site Visitor'		: targetModel = keystone.list( 'Site Visitor' ); break;
		case 'Social Worker'	: targetModel = keystone.list( 'Social Worker' ); break;
		case 'Family'			: targetModel = keystone.list( 'Family' ); break;
		default					: targetModel = keystone.list( 'User' );
	}

	return targetModel;

};

/* get a user of any type by their _id value in the database */
exports.getUserById = function getUserById( req, res, done, id ) {

	let locals = res.locals;

	keystone.list( 'User' ).model
		.findById( id )
		.exec()
		.then(function (user) {

			locals.user = user;
			// execute done function if async is used to continue the flow of execution
			// TODO: if this is used in non-async middleware, done or next should be passed into options and the appropriate one should be executed
			done();

		}, function(err) {

			console.log(err);
			done();

		});
};

exports.checkUserActiveStatus = function( email, locals, done ) {
	
	keystone.list( 'User' ).model
		.findOne()
		.where( 'email', email )
		.exec()
		.then( user => {
			// if a user with the current email doesn't exist
			if( !user ) {
				// exit the login process and let the user know their email or password is invalid
				locals.userStatus = 'nonexistent';
			// if the user exists but isn't active yet
			} else if( !user.isActive || user.isActive === false ) {
				// exit the login process and let the user know their account isn't active yet
				locals.userStatus = 'inactive';
			// if the user exists and is active
			} else {
				// let the system attempt to log the user in
				locals.userStatus = 'active';
			}

			done();

		}, err => {

			console.log( err );
			done();
		});
};

/* gets a user by email */ 
exports.getUserByEmail = ( email ) => {

	return new Promise( ( resolve, reject ) => {
		
		User.model
			.findOne()
			.where( 'email', email )
			.exec()
			.then( user => {
				resolve( user );
			}, err => {
				console.error( `error fetching user by email ${ email } - ${ err } ` );
				reject( err );
			});
	});
}

/* gets a user by password reset token */ 
exports.getUserByPasswordResetToken = ( resetToken ) => {

	return new Promise( ( resolve, reject ) => {
		
		User.model
			.findOne()
			.where( 'resetPasswordToken', resetToken )
			.exec()
			.then( user => {
				resolve( user );
			}, err => {
				console.error( `error fetching user by password reset token ${ resetToken } - ${ err }` );
				reject( err );
			});
	});
}

/* gets the ID of any user type (except families) based on their full name */
exports.getUserByFullName = ( name, userType ) => {
	// bind targetModel to the appropriate keystone model type based on the passed in userType
	const targetModel = exports.getTargetModel( userType );

	return new Promise( ( resolve, reject ) => {

		targetModel.model
			.findOne()
			.where( 'name.full', name )
			.exec()
			.then( user => {
				// if a user with the current email doesn't exist
				if( !user ) {
					return reject( `error fetching user by name ${ name } - no user record found with matching name` );
				}
				// if the user exists, resolve the promise, returning the user object
				resolve( user );
			// if there was an error finding the user
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching user by name: ${ name } - ${ err }` );
				reject();
			});
	});
};

/* IMPORTANT NOTE: The function below is a copy of one above that's bound to async.  Merge them once async is removed */
// TODO: targetModel should be a string, not a Keystone model (change in call locations)
// TODO: rejecting the promise might cause downstream problems in the places this function is called (until they're switched to async/await)
exports.getUserByIdNew = ( { id, targetModel, fieldsToPopulate = [] } ) => {

	return new Promise( ( resolve, reject ) => {
		// stop execution if required information is missing
		if( !id ) {
			return reject( `error fetching user by id - no id passed in` );
		} else if( !targetModel ) {
			return reject( `error fetching user by id - no target model passed in` );
		}
		// fetch the record from the specified model type using the passed in id value
		targetModel.model
			.findById( id )
			.populate( fieldsToPopulate )
			.exec()
			.then( user => {
				// if no user was found
				if( !user ) {
					// log the error for debugging purposes
					console.error( `error fetching user by id ${ id }` );
					// reject the promise
					return reject();

				}
				// if the user was found, resolve the promise with the user object
				resolve( user );
			// if there was an error fetching the user model
			}, err => {
				// log the error for debugging purposes
				console.error( `there was an error fetching user by id ${ id } - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getGalleryPermissions = user => {
	// check for which type of user is making the request
	const userType = user ? user.get( 'userType' ) : undefined;
	// TODO: all of these checks should be virtuals on the models
	const canBookmarkChildren = userType === 'family';
	const canSearchForChildren = userType === 'social worker' || userType === 'family';
	// TODO: canViewAllChildren and canSeeAdvancedOptions are the same check and should have a name that encompasses both
	const canSeeAdvancedSearchOptions = userType === 'social worker' ||
										userType === 'admin' ||
										( userType === 'family' && user.permissions.canViewAllChildren );
	// return an object with the user's gallery permissions									
	return {
		canBookmarkChildren,
		canSearchForChildren,
		canSeeAdvancedSearchOptions
	}
};

exports.checkForBookmarkedChildren = user => {
	// check for which type of user is making the request
	const userType = user ? user.get( 'userType' ) : undefined;
	
	// anonymous users, site visitors, and admin can't bookmark children
	if( !userType || userType === 'site visitor' || userType === 'admin' ) {
		return false;
	}

	// store the bookmarked children and sibling groups
	const bookmarkedChildren = user ? user.get( 'bookmarkedChildren' ) : [];
	const bookmarkedSiblings = user ? user.get( 'bookmarkedSiblings' ) : [];
	// return true if the user has any bookmarked children or siblings, and false otherwise
	return ( bookmarkedChildren && bookmarkedChildren.length > 0 ) ||
		   ( bookmarkedSiblings && bookmarkedSiblings.length > 0 );
};