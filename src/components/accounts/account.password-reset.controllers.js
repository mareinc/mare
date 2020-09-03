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
	let errorData, resetToken;

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
				resetToken = utilities.generateAlphanumericHash( 35 );
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
		.finally( () => {

			// if no errors, send a success message to the user
			if ( !errorData ) {

				errorData = errorUtils.ERRORS.PASSWORD_FORGOT.SUCCESS;

				// log the success for debugging purposes
				errorUtils.logCodedError(
					errorData.code,
					errorData.message,
					`Password reset token (${resetToken}) created for user: ${req.body.email}`,
					true
				);
				
				req.flash( 'success', errorData.flashMessage );

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
	let errorData;

	if ( !resetToken ) {

		// get standardized error data
		errorData = errorUtils.ERRORS.PASSWORD_RESET.NO_RESET_TOKEN;
		// log the error for debugging purposes
		errorUtils.logCodedError(
			errorData.code,
			errorData.message
		);
		// display a message to the user
		req.flash( 'error', errorData.flashMessage );

		// redirect and display the error message
		return res.redirect( 303, '/' );
	}

	UserMiddleware.getUserByPasswordResetToken( resetToken )
		.then( user => {

			// if no user with a matching password reset token could be found, log an error and halt execution
			if ( !user ) {
				// get standardized error data
				errorData = errorUtils.ERRORS.PASSWORD_RESET.NO_USER_WITH_MATCHING_TOKEN;
				throw new Error( `No user exists with reset token: ${resetToken}` );
			}
		})
		.catch( error => {

			// if the error hasn't already been captured
			if ( !errorData ) {
				// get standardized error data
				errorData = errorUtils.ERRORS.PASSWORD_RESET.UNEXPECTED_ERROR;
			}

			// log the error for debugging purposes
			errorUtils.logCodedError(
				errorData.code,
				errorData.message,
				`Attempted password reset with token: ${resetToken}`
			);
			
			// log the thrown error
			console.error( error );
		})
		.finally( () => {

			// if the operation completed successfully
			if ( !errorData ) {

				// set the reset token on locals
				res.locals.resetToken = resetToken;
				// render the reset password form
				new keystone.View( req, res ).render( 'form_reset-password' );

			// if an error occurred
			} else {

				// display a message to the user
				req.flash( 'error', errorData.flashMessage );
				res.redirect( 303, '/' );
			}			
		});
};

exports.changePassword = ( req, res ) => {

	const resetToken        = req.body.resetToken,
		  password          = req.body.password,
		  confirm_password  = req.body.confirm_password;

	if ( !resetToken ) {

		// get standardized error data
		errorData = errorUtils.ERRORS.PASSWORD_RESET.NO_RESET_TOKEN;
		// log the error for debugging purposes
		errorUtils.logCodedError(
			errorData.code,
			errorData.message
		);
		// display a message to the user
		req.flash( 'error', errorData.flashMessage );

		// redirect and display the error message
		return res.redirect( 303, '/' );
	}

	// TODO: check passwords are correct - validation is done through parsley on the front end, but should be checked here as well

	let userDoc, errorData;

	// fetch user with the reset token
	UserMiddleware.getUserByPasswordResetToken( resetToken )
		.catch( error => {
			// get standardized error data
			errorData = errorUtils.ERRORS.PASSWORD_RESET.UNEXPECTED_ERROR;
			// re-throw the error to break promise chain execution and skip to the next .catch block
			throw error;
		})
		.then( user => {

			// if no user with a matching password reset token could be found, log an error and halt execution
			if ( !user ) {
				
				// get standardized error data
				errorData = errorUtils.ERRORS.PASSWORD_RESET.NO_USER_WITH_MATCHING_TOKEN;
				throw new Error( `No user exists with reset token: ${resetToken}` );

			} else {

				userDoc = user;
				// update the password field for the user
				user.set( 'password', password );
				// clear the password reset token to invalidate the password reset link
				user.set( 'resetPasswordToken', '' );
				// set the user to active, allowing them to log in
				user.set( 'isActive', true );

				return user.save();
			}
		})
		.catch( error => {

			// if the error hasn't already been captured
			if ( !errorData ) {
				// get standardized error data
				errorData = errorUtils.ERRORS.PASSWORD_RESET.PASSWORD_SAVE_FAIL;
			}

			// log the error for debugging purposes
			errorUtils.logCodedError(
				errorData.code,
				errorData.message,
				`Attempted password reset with token: ${resetToken}`
			);
			
			// log the thrown error
			console.error( error );
		})
		.finally( () => {

			// if the operation completed successfully
			if ( !errorData ) {

				errorData = errorUtils.ERRORS.PASSWORD_RESET.SUCCESS;

				// log the success for debugging purposes
				errorUtils.logCodedError(
					errorData.code,
					errorData.message,
					`Password reset for user: ${userDoc.get( 'email' )}`,
					true
				);

				// display a success message to the user
				req.flash( 'success', errorData.flashMessage );

			// if an error occurred
			} else {

				// display an error message to the user
				req.flash( 'error', errorData.flashMessage );
			}

			res.redirect( 303, '/' );
		});
};