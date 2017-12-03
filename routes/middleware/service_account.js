// TODO: this is a big one.  Review all middleware and come up with a better division of labor.  All email sending in email_ middleware
//		 but we might want to find a better separation of concerns for fetching model data, modifying models, and utility functions to make
//		 all these middleware files more readable and maintainable.  This involves a review of every middleware function.

// TODO: a lot of this functionality is needed for social worker child/family registration and should potentially be broken out and placed in more
//		 appropriate files

const keystone 						= require( 'keystone' ),
	  User							= keystone.list( 'User' ),
	  SiteVisitor 					= keystone.list( 'Site Visitor' ),
	  SocialWorker 					= keystone.list( 'Social Worker' ),
	  Family						= keystone.list( 'Family' ),
	  Admin							= keystone.list( 'Admin' ),
	  MailingList					= keystone.list( 'Mailing List' ),
	  AccountVerificationCode		= keystone.list( 'Account Verification Code' ),
	  registrationEmailMiddleware	= require( './emails_register' ),
	  staffEmailTargetMiddleware	= require( './service_staff-email-target' ),
	  staffEmailContactMiddleware	= require( './service_staff-email-contact' ),
	  userService					= require( './service_user' ),
	  utilities						= require( './utilities' );

exports.updateUser = ( req, res, next ) => {
	const update	= req.body,
		  userType	= req.user.userType,
		  userId	= req.user.get( '_id' );

	// get the model corresponding to the type of user making the request
	const model = userService.getTargetModel( userType );

	// fetch the users record using the id parameter passed in with the request
	let fetchUser = userService.getUserByIdNew( userId, model );

	// once we've fetched the user model
	fetchUser.then( user => {
		console.log('--update--');
		console.log(update);

		/* NOTE: these are wrapped in if statements because the family account page will have different
				 fields with different names.  If all models share the same field in the same place in the
				 model, you won't need to wrap the update in an if statement.  All fields can be checked in
				 models/User ( for shared fields ), models/User_SiteVisitor, models/User_SocialWorker,
				 models/User_Family, and models/User_Admin.
				 
		   NOTE: it looks like trying to update a field that doesn't exist on the model using user.set()
				 won't add the field, which is a good thing, preventing the need to check for the field
				 on the model before attempting to update */
		if( userType === 'family' ) {
			if( update.contact1 ) {
				if( update.contact1.firstName ) { user.set( 'contact1.name.first', update.contact1.firstName ); }
				if( update.contact1.lastName ) { user.set( 'contact1.name.last', update.contact1.lastName ); }
				if( update.contact1.email ) { user.set( 'contact1.email', update.contact1.email ); }
				if( update.contact1.mobilePhone ) { user.set( 'contact1.phone.mobile', update.contact1.mobilePhone ); }
				if( update.contact1.workPhone ) { user.set( 'contact1.phone.work', update.contact1.workPhone ); }
				if( update.contact1.preferredCommunicationMethod ) { user.set( 'contact1.preferredCommunicationMethod', update.contact1.preferredCommunicationMethod ); }
				if( update.contact1.gender ) { user.set( 'contact1.gender', update.contact1.gender ); }
				if( update.contact1.race ) { user.set( 'contact1.race', update.contact1.race ); }
				if( update.contact1.occupation ) { user.set( 'contact1.occupation', update.contact1.occupation ); }
			}
			if( update.contact2 ) {
				if( update.contact2.firstName ) { user.set( 'contact2.name.first', update.contact2.firstName ); }
				if( update.contact2.lastName ) { user.set( 'contact2.name.last', update.contact2.lastName ); }
				if( update.contact2.email ) { user.set( 'contact2.email', update.contact2.email ); }
				if( update.contact2.mobilePhone ) { user.set( 'contact2.phone.mobile', update.contact2.mobilePhone ); }
				if( update.contact2.workPhone ) { user.set( 'contact2.phone.work', update.contact2.workPhone ); }
				if( update.contact2.preferredCommunicationMethod ) { user.set( 'contact2.preferredCommunicationMethod', update.contact2.preferredCommunicationMethod ); }
				if( update.contact2.gender ) { user.set( 'contact2.gender', update.contact2.gender ); }
				if( update.contact2.race ) { user.set( 'contact2.race', update.contact2.race ); }
				if( update.contact2.occupation ) { user.set( 'contact2.occupation', update.contact2.occupation ); }
			}
		} else {
			if( userType !== 'social worker' ) {
				if( update.homePhone ) { user.set( 'phone.home', update.homePhone ); }
			}
			
			if( update.mobilePhone ) { user.set( 'phone.mobile', update.mobilePhone ); }
			if( update.workPhone ) { user.set( 'phone.work', update.workPhone ); }
		}

		// Social worker specific fields
		if( userType === 'social worker' ) {
			if( update.position ) { user.set( 'position', update.position ); }
			
			if( update.title || update.title === '' ) {
				const newTitle = update.title !== '' ? update.title : undefined;

				user.set( 'title', newTitle );	
			}
		}
		
		// update the submitted user fields
		if( update.firstName ) { user.set( 'name.first', update.firstName ); }
		if( update.lastName ) { user.set( 'name.last', update.lastName ); }
		if( update.email ) { user.set( 'email', update.email ); }
		// if( update.password ) { user.set( 'password', update.password ); } // TODO...

		if( update.preferredPhone ) { user.set( 'phone.preferred', update.preferredPhone ); }

		if( update.address1 ) { user.set( 'address.street1', update.address1 ); }
		if( update.address2 ) { user.set( 'address.street2', update.address2 ); }
		if( update.maCity ) { user.set( 'address.city', update.maCity ); }
		if( update.nonMaCity ) { user.set( 'address.cityText', update.nonMaCity ); }
		if( update.zipCode ) { user.set( 'address.zipCode', update.zipCode ); }
		if( update.isOutsideMassachusetts ) { user.set( 'address.isOutsideMassachusetts', update.isOutsideMassachusetts ); }
		
		// attempt to save the user with the updated information
		user.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				console.error('Error saving to database:', err);
				/* TODO: not every user type will get all of these fields as not all user types have all fields.
						 you'll need to add checks to see if that field exists on the user.  You could do some
						 fanciness here by only keeping the keys in the user object that exist in the update object */
				// respond with the appropriate fields from the original user object
				res.json({
					firstName				: user.get( 'name.first' ),
					lastName				: user.get( 'name.last' ),
					homePhone				: user.get( 'phone.home' ),
					mobilePhone				: user.get( 'phone.mobile' ),
					workPhone				: user.get( 'phone.work' ),
					address1				: user.get( 'address.street1' ),
					address2				: user.get( 'address.street2' ),
					zipCode					: user.get( 'address.zipCode' ),
					isOutsideMassachusetts	: user.get( 'isOutsideMassachusetts' )
				});
			// if the model was successfully saved
			} else {
				/* TODO: this is a bad practice, the appropriate fields from the updated user object should be returned instead */
				// respond with the update object as it will have all 
				res.json( update );
			}
		});
	})
	.catch( () => {
		// log the error for debugging purposes
		console.error( `there was an error updating details for user with id ${ userId }` );
		// send an empty response back to the user
		res.send();
	});
}