const keystone = require( 'keystone' );

module.exports = ( req, res ) => {

	const verificationCode = req.query.verificationCode,
		  userType         = req.query.userType;

	if( !verificationCode || !userType ) {
		// log the error
		console.error( `account verification Error - bad request paramaters -> verificationCode: ${ verificationCode }, userType: ${ userType }` );
		req.flash( 'error', { title: 'There was an error processing your request.',
		details: 'If this error persists, please notify MARE' } );
		res.redirect('/');
		return;
	}

	keystone.list( 'Account Verification Code' ).model
		.findOne()
		.where( 'code', verificationCode )
		.exec()
		.then( verificationEntity => {

			if( !verificationEntity ){
				console.error( `account verification error - could not find verification model based on verification code ${ verificationCode }` );
				req.flash( 'error', { title: 'Verification record not found.'} );
				res.redirect('/');
				return;
			}
			
			// we found the verificationEntity and we want to remove it
			var userId = verificationEntity.user;

			updateUser( userId, userType )
				.then( () => {
					// delete the verification record 
					verificationEntity.remove( err => {
						if( err )
							console.error( 'account verification error - could not remove the verification model entity' );
					});
					// @mo, I'd recommend creating a flash message, then redirecting to the home page
					req.flash( 'success', { title: 'Your account has been verified',
					detail: 'put any additional details here if you want, otherwise remove the details attribute' } );

					res.status( 200 ).redirect('/');
				})  
				.catch( () =>{
					console.error( 'account verification Error - could not update the user field' );
				});
		}, err => {
			console.error( 'error processing verification email' )
			console.error( err );

		});
};

/* updates the isVerified field of the user */
function updateUser( userId, userType ){

	return new Promise( ( resolve, reject ) =>{

		let targetModel;

		switch( userType ) {
			case 'site visitor' : targetModel = keystone.list( 'Site Visitor' ); break;
			case 'family'       : targetModel = keystone.list( 'Family' ); break;
			case 'social worker': targetModel = keystone.list( 'Social Worker' ); break;
			default             : targetModel = keystone.list( 'Site Visitor' );
		}

		targetModel
			.findById( userId )
			.exec()
			.then( user => {
				// set the user to verified
				user.permissions.isVerified = true;
				// save user 
				user.save( err => {
					if( err ) {
						console.error( `account verification error - could not save updated user ${ userId }` );
						reject();
					}
				});
				
				resolve();

			}, err => {
				if( err ){
					console.error( `account verification error - could not find user ${ userId }` );
					reject( err );
				}
			});
	});
}