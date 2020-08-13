const keystone                      = require( 'keystone' ),
	  utilities                     = require( '../../utils/utility.controllers' ),
	  errorUtils					= require( '../../utils/errors.controllers' ),
	  PasswordResetEmailMiddleware  = require( './account.email.controllers' ),
	  UserMiddleware                = require( '../users/user.controllers' );

exports.resetPassword = ( req, res ) => {
	// store a reference to locals
	const locals = res.locals;

	if ( !req.body.email ) {

		// get standardized error data
		const errorData = errorUtils.ERRORS.PASSWORD_FORGOT.INVALID_EMAIL_FORMAT;
		// log the error for debugging purposes
		errorUtils.logCodedError(
			errorData.code,
			errorData.message,
			`Attempted password reset with email: ${req.body.email || 'No email provided'}`
		);
		// display a message to the user
		req.flash( 'error', errorData.flashMessage );
		
		res.redirect( 303, '/' ); // TODO: this needs to be fixed as the token information will be lost on redirect
	
		return;
	}

	// placeholder for error data
	let errorData;

	// attempt to fetch the user using the email provided
	UserMiddleware.getUserByEmail( req.body.email )
		// handle errors from fetching user by email
		.catch( error => {

			// get standardized error data
			errorData = errorUtils.ERRORS.PASSWORD_FORGOT.UNEXPECTED_ERROR;
			// re-throw the error to break promise chain execution and skip to the next .catch block
			throw error;
		})
		// create reset token and save it to user record
		.then( user => {

			// if no user could be found
			if ( !user ) {

				// get standardized error data
				errorData = errorUtils.ERRORS.PASSWORD_FORGOT.NO_MATCHING_EMAIL;
				// throw an error to break promise chain execution and skip to the next .catch block
				throw new Error( `No account exists with email: ${req.body.email}` );

			} else {
				// TODO: should this be stored in a more permanent location?
				// generate a new password reset token 
				const resetToken = utilities.generateAlphanumericHash( 35 );
				// set the reset password token for the user record
				user.resetPasswordToken = resetToken;
				// save the user record
				return user.save();
			}
		})
		// handle errors from token creation/record saving
		.catch( error => {

			// if the error hasn't been caught
			if ( !errorData ) {
				// get standardized error data
				errorData = errorUtils.ERRORS.PASSWORD_FORGOT.RESET_TOKEN_SAVE_FAIL;
			}
			// re-throw the error to break promise chain execution and skip to the next .catch block
			throw error;
		})
		// send email with reset token to the user
		.then( user => {
			
			// the name is stored differently for families than for other models
			const name = user.get( 'userType' ) === 'family' ?
							user.get( 'displayName' ) :
							user.get( 'name.full' );

			// create an email with the reset token and save the user entity
			return PasswordResetEmailMiddleware.sendPasswordResetEmail( name, user.email, locals.host, user.resetPasswordToken );
		})
		// handle errors from email sending
		.catch( error => {

			// if the error hasn't been caught
			if ( !errorData ) {
				// get standardized error data
				errorData = errorUtils.ERRORS.PASSWORD_FORGOT.RESET_EMAIL_SEND_FAIL;
			}
			
			// this is the last .catch block, so log the coded error for debugging purposes
			errorUtils.logCodedError(
				errorData.code,
				errorData.message,
				`Attempted password reset with email: ${req.body.email}`
			);

			// log the thrown error
			console.error( error );
		})
		// log any errors and send success/error message to user
		.finally(() => {

			// if no errors, send a success message to the user
			if (!errorData) {
				
				req.flash( 'success', {
					title: 'Success',
					detail: 'We have emailed you a link to reset your password.  Please follow the instructions in your email.'
				});

			// otherwise, display an error message
			} else {
				req.flash( 'error', errorData.flashMessage );
			}
			
			res.redirect( 303, '/' );
		});
};

// TODO: make this an express view
exports.getForm = ( req, res ) => {

	const resetToken = req.query.resetToken;

	if ( !resetToken ) {
		
		console.error( `password reset error - reset token not provided` );
		
		req.flash( 'error', {
			title: 'There was an error with your password reset request.',
			detail: 'Please try using the forgot password button again.  If the issue persists, please contact MARE at <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>'
		});

		res.redirect( 303, '/' );
		
		return;
	}

	UserMiddleware.getUserByPasswordResetToken( resetToken )
		.then( user => {

			if ( !user ) {
				
				req.flash( 'error', {
					title: 'There was an error with your password reset request.',
					detail: 'Please try using the forgot password button again.  If the issue persists, please contact MARE at <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>'
				});
				
				throw new Error( `password reset error - no user found matching password reset token ${ resetToken }` );
			}
		

			const view = new keystone.View( req, res ),
		   
			locals = res.locals;
			// pass the reset token to the view
			locals.resetToken = resetToken;

			view.render( 'form_reset-password' );

		})
		.catch( err => {
			// log errors for debugging purposes
			console.error( err );

			res.redirect( 303, '/' );
		});
};

exports.changePassword = ( req, res ) => {

	const resetToken        = req.body.resetToken,
		  password          = req.body.password,
		  confirm_password  = req.body.confirm_password;

	if ( !resetToken ) {

		console.error( `change password error - reset token not provided` );
		
		return;
	}

	// TODO: check passwords are correct - validation is done through parsley on the front end, but should be checked here as well

	//fetch user with the reset token 
	const fetchUser = UserMiddleware.getUserByPasswordResetToken( resetToken )
		
	fetchUser
		.then( user => {

			if ( !user ) {
				
				req.flash( 'error', {
					title: 'There was an error with your password reset request.',
					detail: 'Please try using the forgot password button again.  If the issue persists, please contact MARE at <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>'
				});

				throw new Error( `Error fetching user by password reset token ${ resetToken }` );
		   
			} else {
				// update the password field for the user
				user.set( 'password', password );
				//reset the password token so that users cant use the link anymore
				user.set( 'resetPasswordToken', '' );
				// set the user to active, allowing them to log in
				user.set( 'isActive', true );

				user.save( err => {
					
					if( err ) {

						req.flash( 'error', {
							title: 'There was an error with your password reset request.',
							detail: 'Please try using the forgot password button again.  If the issue persists, please contact MARE at <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>'
						});
						
						throw new Error( `error saving user model with new password`, err );
					}
				});

				req.flash( 'success', {
					title: 'Success',
					detail: `The password for your account ${ user.get( 'email' ) } has been successfully updated.`
				});
			}

			res.redirect( 303, '/' );
		})
		.catch( err => {

			console.error( err );

			res.redirect( 303, '/' );
		});
};