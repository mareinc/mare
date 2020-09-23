const keystone 		= require( 'keystone' ),
	  errorUtils	= require( '../../utils/errors.controllers' ); 

module.exports = ( req, res ) => {

	const verificationCode = req.body.verificationCode,
		  userType         = req.body.userType;

	let errorData,
		verificationRecord;

	if( !verificationCode || !userType ) {

		// get standardized error data
		errorData = errorUtils.ERRORS.ACCOUNT_VERIFICATION.NO_VERIFICATION_CODE;
		// log the error for debugging purposes
		errorUtils.logCodedError(
			errorData.code,
			errorData.message,
			`Attempted account verification with missing verification code and/or user type.
			 verification code: ${verificationCode}
			 user type: ${userType}`
		);
		// display a message to the user
		req.flash( 'error', errorData.flashMessage );

		return res.redirect( 303, '/' );
	}

	keystone.list( 'Account Verification Code' ).model
		.findOne()
		.where( 'code', verificationCode )
		.exec()
		.then( verificationEntity => {

			// if no matching verification code exists
			if( !verificationEntity ){

				// get standardized error data
				errorData = errorUtils.ERRORS.ACCOUNT_VERIFICATION.NO_MATCHING_VERIFICATION_RECORD;
				
				// throw an error to break promise chain execution and skip to the next .catch block
				throw new Error( `No Account Verification Code exists with code: ${verificationCode}` );

			// if the verification code has already been used (i.e. account is already verified)
			} else if ( verificationEntity.isExchanged ) {

				// get standardized error data
				errorData = errorUtils.ERRORS.ACCOUNT_VERIFICATION.ALREADY_VERIFIED;
				
				// throw an error to break promise chain execution and skip to the next .catch block
				throw new Error( `Account Verification Code has already been exchanged: ${verificationCode}` );

			// otherwise, exchange the token and mark the account verified
			} else {

				verificationRecord = verificationEntity;
				return updateUser( verificationEntity.user, userType );
			}
		})
		.catch( error => {

			// get standardized error data
			if ( !errorData ) {
				errorData = error === 'USER_UPDATE_FAILED'
					? errorUtils.ERRORS.ACCOUNT_VERIFICATION.USER_UPDATE_FAILED
					: errorUtils.ERRORS.ACCOUNT_VERIFICATION.UNEXPECTED_ERROR;
			}

			// this is the last .catch block, so log the coded error for debugging purposes
			errorUtils.logCodedError(
				errorData.code,
				errorData.message,
				`Attempted account verification with code: ${verificationCode}`
			);

			// log the thrown error
			console.error( error );
		})
		.finally( () => {

			// if no errors, send a success message to the user and mark the verification code as 'exchanged'
			if ( !errorData ) {

				verificationRecord.isExchanged = true;
				verificationRecord.save();
				
				req.flash( 'success', {
					title: 'Success',
					detail: 'We have verified your email address.  You are now able to log in to your MARE account.'
				});

			// otherwise, display an error message
			} else {
				req.flash( 'error', errorData.flashMessage );
			}
			
			res.redirect( 303, '/' );
		});
};

/* updates the isVerified field of the user */
function updateUser( userId, userType ){

	return new Promise( ( resolve, reject ) => {

		let targetModel;

		switch( userType ) {
			case 'site visitor' : targetModel = keystone.list( 'Site Visitor' ); break;
			case 'family'       : targetModel = keystone.list( 'Family' ); break;
			case 'social worker': targetModel = keystone.list( 'Social Worker' ); break;
			default             : targetModel = keystone.list( 'Site Visitor' );
		}

		targetModel.model
			.findById( userId )
			.exec()
			.then( user => {
				// set the user to verified
				user.permissions.isVerified = true;
				// save user 
				user.save( err => {
					if( err ) {
						console.error( `account verification error - could not save updated user ${ userId }` );
						console.error ( err );
						reject( 'USER_UPDATE_FAILED' );
					} else {
						resolve();
					}
				});
			}, err => {
				if( err ){
					console.error( `account verification error - could not find user ${ userId }` );
					reject( err );
				}
			});
	});
}