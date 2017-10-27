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
	  MailingList					= keystone.list( 'Mailing List' ),
	  AccountVerificationCode		= keystone.list( 'Account Verification Code' ),
	  registrationEmailMiddleware	= require( './emails_register' ),
	  staffEmailTargetMiddleware	= require( './service_staff-email-target' ),
	  staffEmailContactMiddleware	= require( './service_staff-email-contact' ),
	  utilities						= require( './utilities' );

exports.updateUser = ( req, res, next ) => {
	const user = req.body;

	console.log('__USER INFO:__');
	console.log(user);
}

exports.ORIGupdateUser = ( req, res, next ) => {
	// extract the submitted user information
	const user = req.body;
	// store the registration type which determines which path we take during registration
	const registrationType = user.registrationType;
	// create a variable to hold the redirect path to take the user to a target page after processing is complete
	let redirectPath;

	exports.saveUser( user ).then( updatedUserModel => {
		// if the new site visitor model was saved successfully
		// create a success flash message
		req.flash( 'success', { title: 'Your account has been successfully saved' } );
		// create a new random code for the user to verify their account with
		const verificationCode = utilities.generateAlphanumericHash( 35 );
		// store the database id of the newly created user
		const userId = updatedUserModel.get( '_id' );
		// store the user type found in the returned model
		const userType = updatedUserModel.userType;
		// store the host name to link to the verification code in the thank you email
		const host = req.headers.host;
		// store the array of mailing list ids the user has opted into
		const mailingListIds = user.mailingLists;
		// create a new verification code model in the database to allow users to verify their accounts
		const createVerificationRecord = exports.createNewVerificationModel( verificationCode, userId );
		// fetch contact info for the staff contact for site visitor registration
		const fetchRegistrationStaffContactInfo = exports.getRegistrationStaffContactInfo( 'site visitor' );
		// once the contact info has been fetched
		Promise.all( [ createVerificationRecord, fetchRegistrationStaffContactInfo ] ).then( values => {
			// assign local variables to the values returned by the promises
			const [ verificationRecord, staffContactInfo ] = values;
			// send the thank you email to the user
			const thankYouEmailSentToUser = registrationEmailMiddleware.sendThankYouEmailToUser( staffContactInfo, user.email, userType, verificationCode, host );
			// TODO: need to send a notification email to the appropriate staff member as well ( check with Lisa to see if this is needed )
			// add the user to any mailing lists they've opted into
			const userAddedToMailingLists = exports.addToMailingLists( updatedUserModel, mailingListIds, registrationType );
			// if there was an error sending the thank you email to the new site visitor
			thankYouEmailSentToUser.catch( reason => {
				// log the reason the promise was rejected
				console.error( reason );
			});
			// if there was an error adding the new site visitor to the target mailing lists
			userAddedToMailingLists.catch( reason => {
				// log the reason the promise was rejected
				console.error( reason );
			});
			// redirect the user back to the appropriate page
			res.redirect( 303, redirectPath );
		// if there was an error saving the verification model or fetching the the registration staff contact info
		}).catch( reason => {
			// log the reason the promise was rejected
			console.error( reason );
			// redirect the user back to the appropriate page
			res.redirect( 303, redirectPath );
		});
	})
	// if there was an error saving the new site visitor
	.catch( () => {
		// create an error flash message to send back to the user
		req.flash( 'error', {
			title: 'There was an error creating your account',
			detail: 'If this error persists, please contact MARE for assistance' } );
		// redirect the user back to the appropriate page
		res.redirect( 303, redirectPath );
	});
};

exports.saveUser = user => {

	return new Promise( ( resolve, reject ) => {
		// create a new site visitor model with the passed in data
		let newUser = new SiteVisitor.model({

			name: {
				first					: user.firstName,
				last					: user.lastName
			},

			password					: user.password,
			email						: user.email,

			phone: {
				work					: user.workPhone,
				home					: user.homePhone,
				mobile					: user.mobilePhone,
				preferred 				: user.preferredPhone
			},

			address: {
				street1					: user.street1,
				street2					: user.street2,
				isOutsideMassachusetts	: user.isNotMACity,
				city					: user.isNotMACity ? undefined : user.MACity,
				cityText				: user.isNotMACity ? user.nonMACity : '',
				state					: user.state,
				zipCode					: user.zipCode
			},

			heardAboutMAREFrom 			: user.howDidYouHear,
			heardAboutMAREOther			: user.howDidYouHearOther

		});

		newUser.save( ( err, model ) => {
			// if there was an issue saving the new site visitor
			if( err ) {
				// reject the promise with a descriptive message
				return reject( `there was an error saving the new site visitor model ${ err }` );
			}
			// resolve the promise with the newly saved site visitor model
			resolve( model );
		});
	});
};

/* add the passed in user to the emails specified in the mailingListIds array using registrationType to find the target field */
exports.addToMailingLists = ( user, mailingListIds, registrationType ) => {

	return new Promise( ( resolve, reject ) => {
		// filter out any invalid strings.  False values from form submissions will result in an empty string
		const validMailingListIds = mailingListIds.filter( ( mailingListId ) => mailingListId !== "" );
		// if there were no mailing lists the user opted into
		if( !validMailingListIds || validMailingListIds.length === 0 ) {
			return resolve();
		}
		// create an array to hold promises for adding the user asynchronously to each mailing list
		let addUserToMailingLists = [];
		// loop through each mailing list id
		for( let mailingListId of validMailingListIds ) {
			// create a promise around adding the user to the current mailing list and push it to the array
			addUserToMailingLists.push( exports.addToMailingList( user, mailingListId, registrationType ) );
		}
		// once the user has been added to all mailing lists
		Promise.all( addUserToMailingLists ).then( values => {
			// resolve the promise
			resolve();
		// if any error were encountered
		}).catch( reason => {
			// reject the promise with the reason
			reject( reason );
		});
	});
};
/* add the passed in user to a specified mailing list using registrationType to find the target field */
exports.addToMailingList = ( user, mailingListId, registrationType ) => {

	return new Promise( ( resolve, reject ) => {

		MailingList.model
			.findById( mailingListId )
			.exec()
			.then( mailingList => {
				// if the mailing list wasn't found
				if( !mailingList ) {
					// reject the promise with the id of the list the user couldn't be added to
					reject( `error fetching mailing list: ${ mailingListId }` );
				}
				// add the user id to the correct Relationship field in the mailing list based on what type of user they are
				switch( registrationType ) {
					case 'siteVisitor'	: mailingList.siteVisitorSubscribers.push( user.get( '_id' ) ); break;
					case 'socialWorker'	: mailingList.socialWorkerSubscribers.push( user.get( '_id' ) ); break;
					case 'family'		: mailingList.familySubscribers.push( user.get( '_id' ) );
				}
				// attempt to save the updated mailing list
				mailingList.save( ( err, model ) => {
					// if there was an error saving the updated mailing list model
					if( err ) {
						// reject the promise with details about the failure
						return reject( `error saving user ${ user.get( '_id' ) } to mailing list ${ model.mailingList }` );
					}
					// if there was no error, resolve the promise
					resolve();
				});
			});
	});
};

/* TODO: if there's no file to save, we shouldn't be fetching a model, create a short circuit check */
exports.uploadFile = ( userModel, targetFieldPrefix, targetField, file ) => {

	// TODO: placeholder until the file upload has been fixed
	return new Promise( ( resolve, reject ) => {
		resolve();
	});
	// // exit this function if there's no file to upload
	// if( !file ) {
	// 	console.log( 'uploadFile - no file to upload, exiting early' );

	// 	return done();
	// }

	// userModel.model.findById( res.locals.newUserID )
	// 			.exec()
	// 			.then( user => {
	// 				console.log( 'file' );
	// 				console.log( file );

	// 				user[ targetFieldPrefix ][ targetField ] = file;

	// 				user.save( ( err, model ) => {
	// 					console.log( `file saved for the user` );

	// 					done();
	// 				});

	// 			}, err => {
	// 				console.log( `error fetching user to save file attachment: ${ err }` );

	// 				done();
	// 			});
};

exports.getStages = family => {

	stages = {
		MAPPTrainingCompleted: {},
		workingWithAgency: {},
		lookingForAgency: {},
		gatheringInformation: {}
	};
	// If no checkboxes have been checked for process progression, return the empty object
	if( family.processProgression === undefined ) {
		return stages;
	}

	if( family.processProgression.indexOf( 'MAPPTrainingCompleted' ) !== -1 ) {

		stages.MAPPTrainingCompleted.completed = true;
		stages.MAPPTrainingCompleted.date = exports.getCurrentDate();

	} else if( family.processProgression.indexOf( 'workingWithAgency' ) !== -1 ) {

		stages.workingWithAgency.started = true;
		stages.workingWithAgency.date = exports.getCurrentDate();

	} else if( family.processProgression.indexOf( 'lookingForAgency' ) !== -1 ) {

		stages.lookingForAgency.started = true;
		stages.lookingForAgency.date = exports.getCurrentDate();

	} else if( family.processProgression.indexOf( 'gatheringInformation' ) !== -1 ) {

		stages.gatheringInformation.started = true;
		stages.gatheringInformation.date = exports.getCurrentDate();

	}

	return stages;
};

exports.createNewVerificationModel = ( verificationCode, userId ) => {
	
	return new Promise( ( resolve, reject ) => {
		// create the new verification model
		var newVerificationCodeModel = new AccountVerificationCode.model({
			code	: verificationCode,
			user	: userId,
			dateSent: new Date()
		});
		// attempt to save the new verification model
		newVerificationCodeModel.save( ( err, model ) => {
			// if the model saved successfully, resolve the promise, returning the newly saved model
			resolve( model );
		// if there was an error saving the new model to the database
		}, err => {
			// reject the promise with the reason for the rejection
            reject( `error saving the new verification code model for user ${ userId }: ${ err }` );
		});
	});
};