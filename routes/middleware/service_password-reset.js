const keystone                      = require( 'keystone' ),
	  utilities                     = require( './utilities' ),
	  PasswordResetEmailMiddleware  = require( './emails_password-reset' ),
	  UserMiddleware                = require( './service_user' );

exports.resetPassword = ( req, res ) => {
	// store a reference to locals
	const locals = res.locals;

	if ( !req.body.email ) {
		// log errors for debugging purposes
		console.error( `error initiating reset password - email address invalid` );

		req.flash( 'error', {
			title: 'Please enter a valid email address', // TODO: this should be handled in the Backbone view using Parsley data validation as well as here
		});
		
		res.redirect( 303, '/' ); // TODO: this needs to be fixed as the token information will be lost on redirect
	
		return;
	}
	// attempt to fetch the user using the email provided
	const fetchUser = UserMiddleware.getUserByEmail( req.body.email )

	fetchUser
		.then( user => {

			if ( !user ) {
				
				req.flash( 'error', {
					title: 'There is no account associated with this email address.',
					detail: 'If applicable, please attempt to log in with a secondary/spouse email address.  Otherwise register to create a new account or contact MARE at communications@mareinc.org for assistance.'
				});

				throw new Error( `error fetching user by email ${ req.body.email }` );

			} else {
				// TODO: should this be stored in a more permanent location?
				// generate a new password reset token 
				const resetToken = utilities.generateAlphanumericHash( 35 );
				// set the reset password token for the user record
				user.resetPasswordToken = resetToken;

				// the name is stored differently for families than for other models
				const name = user.get( 'userType' ) === 'family' ?
							 user.get( 'displayName' ) :
							 user.get( 'name.full' );
				
				// create an email with the reset token and save the user entity
				const sendPasswordResetEmail = PasswordResetEmailMiddleware.sendPasswordResetEmail( name, user.email, locals.host, resetToken );
				// if there was an error sending the password reset email
				sendPasswordResetEmail
					.catch( err => {
						
						req.flash( 'error', {
							title: 'Error with your request',
							detail: 'There was an issue sending your password reset email.  Please try using the forgot password button again.  If the issue persists, please contact MARE for assistance'
						});

						throw new Error( `error sending reset password email - ${ err }` );
					});
				// TODO: saving the reset token to the user should come first, and an email should only be sent if successful
				user.save( err => {

					if( err ) {

						req.flash( 'error', {
							title: 'Error with your request',
							detail: 'Please try using the forgot password button again.  If the issue persists, please contact MARE for assistance'
						});

						throw new Error( `error saving password reset token to user with email ${ req.body.email } - ${ err }` );
					}
				});

				req.flash( 'success', {
					title: 'Success',
					detail: 'We have emailed you a link to reset your password.  Please follow the instructions in your email.'
				});

				res.redirect( 303, '/' );
			}
		})
		.catch( err => {
			// log the error for debugging purposes
			console.error( err );

			res.redirect( 303, '/' );
		});

};

// TODO: make this an express view
exports.getForm = ( req, res ) => {

	const resetToken = req.query.resetToken;

	if ( !resetToken ) {
		
		console.error( `password reset error - reset token not provided` );
		
		req.flash( 'error', {
			title: 'Error with your request',
			detail: 'The link you used is no longer valid.  Please try using the forgot password button again.  If the issue persists, please contact MARE for assistance'
		});

		res.redirect( 303, '/' );
		
		return;
	}

	UserMiddleware.getUserByPasswordResetToken( resetToken )
		.then( user => {

			if ( !user ) {
				
				req.flash( 'error', {
					title: 'Error with your request',
					detail: 'The reset token provided is not valid or expired.  Please try using the forgot password button again.  If the issue persists, please contact MARE for assistance'
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
				
				req.flash('error', {
					title: 'Error with your request',
					detail: 'The reset token provided is not valid or expired. Please try using the forgot password button again.'
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
							title: 'Error with your request',
							detail: 'Please try using the forgot password button again.  If the issue persists, please contact MARE for assistance'
						});
						
						throw new Error( `error saving user model with new password - ${ err }` );
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