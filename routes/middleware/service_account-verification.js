const keystone = require( 'keystone' );

module.exports = ( req, res ) => {

	const verificationCode = req.query.verificationCode,
		  userType         = req.query.userType;

	if( !verificationCode || !userType ) {
		// log the error
		console.error( `account verification Error - bad request paramaters -> verificationCode: ${ verificationCode }, userType: ${ userType }` );
		
		req.flash( 'error', {
			title: 'There was an error verifying your account',
			detail: 'If this error persists, please notify MARE at <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>'
		});
		
		res.redirect( 303, '/' );
		
		return;
	}

	keystone.list( 'Account Verification Code' ).model
		.findOne()
		.where( 'code', verificationCode )
		.exec()
		.then( verificationEntity => {

			if( !verificationEntity ){
				
				console.error( `account verification error - could not find verification model based on verification code ${ verificationCode }` );
				
				req.flash( 'error', {
					title: 'There was an error verifying your account',
					detail: 'If this error persists, please notify MARE at <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>'
				});
				
				res.redirect( 303, '/' );
				
				return;
			}
			
			// we found the verificationEntity and we want to remove it
			var userId = verificationEntity.user;

			updateUser( userId, userType )
				.then( () => {
					// delete the verification record 
					verificationEntity.remove( err => {
						
						if( err ) {
							console.error( 'account verification error - could not remove the verification model entity' );
						}
					});

					req.flash( 'success', { title: 'Thank you for verifying your account' } );

					res.redirect( 200, '/' );
				})  
				.catch( () =>{

					console.error( 'account verification Error - could not update the user field' );

					req.flash( 'error', {
						title: 'There was an error verifying your account',
						detail: 'If this error persists, please notify MARE at <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>'
					});

					res.redirect( 303, '/' );
				});
		}, err => {

			console.error( `error processing verification email - ${ err }` );

			req.flash( 'error', {
				title: 'There was an error verifying your account',
				detail: 'If this error persists, please notify MARE at <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>'
			});

			res.redirect( 303, '/' );
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