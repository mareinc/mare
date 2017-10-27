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

exports.registerUser = ( req, res, next ) => {
	// extract the submitted user information
	const user = req.body;
	// store the registration type which determines which path we take during registration
	const registrationType = user.registrationType;
	// create a variable to hold the redirect path to take the user to a target page after processing is complete
	let redirectPath;
	
	// set the redirect URL for use throughout the registration process
	switch( registrationType ) {
		case 'siteVisitor'	: redirectPath = '/register#site-visitor'; break;
		case 'socialWorker'	: redirectPath = '/register#social-worker'; break;
		case 'family'		: redirectPath = '/register#family'; break;
	}

	// check for conditions that will prevent saving the model
	const isEmailValid			= exports.validateEmail( user.email );			// returns true/false
	const fetchDuplicateEmail	= exports.checkForDuplicateEmail( user.email ); // returns a promise
	const isPasswordValid		= exports.validatePassword( user.password, user.confirmPassword ); // returns true/false

	fetchDuplicateEmail.then( isEmailDuplicate => {
		// set flash messages for any errors with the email/password information submitted
		exports.setInitialErrorMessages( req, isEmailValid, isEmailDuplicate, isPasswordValid );
		// if initial errors exist, prevent additional processing, alert the user via the flash messages above
		if( !isEmailValid || isEmailDuplicate || !isPasswordValid ) {
			// and redirect to the appropriate page 
			res.redirect( 303, redirectPath );
		// if there were no initial errors, proceed with creating the account
		} else {
			if( registrationType === 'siteVisitor' ) {
				// save the site visitor model using the submitted user details
				exports.saveSiteVisitor( user ).then( newSiteVisitor => {
					// if the new site visitor model was saved successfully
					// create a success flash message
					req.flash( 'success', { title: 'Your account has been successfully created' } );
					// create a new random code for the user to verify their account with
					const verificationCode = utilities.generateAlphanumericHash( 35 );
					// store the database id of the newly created user
					const userId = newSiteVisitor.get( '_id' );
					// store the user type found in the returned model
					const userType = newSiteVisitor.userType;
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
						const userAddedToMailingLists = exports.addToMailingLists( newSiteVisitor, mailingListIds, registrationType );
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

			} else if( registrationType === 'socialWorker' ) {
				// save the social worker model
				exports.saveSocialWorker( user ).then( newSocialWorker => {
					// if the new social worker model was saved successfully
					req.flash( 'success', {
						title: 'Your account has been successfully created',
						detail: 'Please note that it can take several days for your account to be reviewed and activated.  You will receive an email once MARE has had a chance to review your information.' } );
					// create a new random code for the user to verify their account with
					const verificationCode = utilities.generateAlphanumericHash( 35 );
					// store the database id of the newly created user
					const userId = newSocialWorker.get( '_id' );
					// store the user type found in the returned model
					const userType = newSocialWorker.userType;
					// store the host name to link to the verification code in the thank you email
					const host = req.headers.host;
					// store the array of mailing list ids the user has opted into
					const mailingListIds = user.mailingLists;
					// create a new verification code model in the database to allow users to verify their accounts
					const createVerificationRecord = exports.createNewVerificationModel( verificationCode, userId );
					// fetch contact info for the staff contact for social worker registration
					const fetchRegistrationStaffContactInfo = exports.getRegistrationStaffContactInfo( 'social worker' );
					// once the contact info has been fetched
					Promise.all( [ createVerificationRecord, fetchRegistrationStaffContactInfo ] ).then( values => {
						// assign local variables to the values returned by the promises
						const [ verificationRecord, staffContactInfo ] = values;
						// send the thank you email to the user
						const thankYouEmailSentToUser = registrationEmailMiddleware.sendThankYouEmailToUser( staffContactInfo, user.email, userType, verificationCode, host );
						// TODO: need to send a notification email to the appropriate staff member as well ( check with Lisa to see if this is needed )
						// add the user to any mailing lists they've opted into
						const userAddedToMailingLists = exports.addToMailingLists( newSocialWorker, mailingListIds, registrationType );
						// if there was an error sending the thank you email to the new social worker
						thankYouEmailSentToUser.catch( reason => {
							// log the reason the promise was rejected
							console.error( reason );
						});
						// if there was an error adding the new social worker to the target mailing lists
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
				// if there was an error saving the new social worker
				.catch( () => {
					// create an error flash message to send back to the user
					req.flash( 'error', {
						title: 'There was an error creating your account',
						detail: 'If this error persists, please contact MARE for assistance' } );
					
					res.redirect( 303, redirectPath );
				});

			} else if ( registrationType === 'family' ) {
				// store any uploaded files
				// TODO: these still need to be handled
				const files = req.files;
				// save the family model
				exports.saveFamily( user ).then( newFamily => {
					// if the new family model was saved successfully
					req.flash( 'success', {
						title: 'Your account has been successfully created',
						detail: 'Please note that it can take several days for your account to be reviewed and activated.  You will receive an email once MARE has had a chance to review your information.' } );
					// create a new random code for the user to verify their account with
					const verificationCode = utilities.generateAlphanumericHash( 35 );
					// store the database id of the newly created user
					const userId = newFamily.get( '_id' );
					// store the user type found in the returned model
					const userType = newFamily.userType;
					// store the host name to link to the verification code in the thank you email
					const host = req.headers.host;
					// store the array of mailing list ids the user has opted into
					const mailingListIds = user.mailingLists;
					// create a new verification code model in the database to allow users to verify their accounts
					const createVerificationRecord = exports.createNewVerificationModel( verificationCode, userId );
					// fetch contact info for the staff contact for family registration
					const fetchRegistrationStaffContactInfo = exports.getRegistrationStaffContactInfo( 'family' );
					// once the contact info has been fetched
					Promise.all( [ createVerificationRecord, fetchRegistrationStaffContactInfo ] ).then( values => {
						// assign local variables to the values returned by the promises
						const [ verificationRecord, staffContactInfo ] = values;
						// send the thank you email to the user
						const thankYouEmailSentToUser = registrationEmailMiddleware.sendThankYouEmailToUser( staffContactInfo, user.email, userType, verificationCode, host );
						// TODO: need to send a notification email to the appropriate staff member as well ( check with Lisa to see if this is needed )
						// add the user to any mailing lists they've opted into
						const userAddedToMailingLists = exports.addToMailingLists( newFamily, mailingListIds, registrationType );
						// save any submitted files and append them to the newly created user
						const userFilesUploaded = exports.uploadFile( newFamily, 'homestudy', 'homestudyFile_upload', files.homestudyFile_upload );
						// if there was an error sending the thank you email to the new family
						thankYouEmailSentToUser.catch( reason => {
							// log the reason the promise was rejected
							console.error( reason );
						});
						// if there was an error adding the new family to the target mailing lists
						userAddedToMailingLists.catch( reason => {
							// log the reason the promise was rejected
							console.error( reason );
						});
						// if there was an error uploading the files to the new user
						userFilesUploaded.catch( reason => {
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
				// if there was an error saving the new family
				.catch( () => {
					// create an error flash message to send back to the user
					req.flash( 'error', {
						title: 'There was an error creating your account',
						detail: 'If this error persists, please contact MARE for assistance' } );
					
					res.redirect( 303, redirectPath );
				});
			}
		}
	})
	.catch( reason => {
		
		req.flash( `error`, {
					title: `There was a problem creating your account`,
					detail: `If the problem persists, please contact MARE for assistance` } );
		
		res.redirect( 303, redirectPath );
	});
};

exports.saveSiteVisitor = user => {

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

exports.saveSocialWorker = user => {
 
	return new Promise( ( resolve, reject ) => {

		const newUser = new SocialWorker.model({

			name: {
				first					: user.firstName,
				last					: user.lastName
			},

			password					: user.password,
			email						: user.email,
			agencyNotListed				: true,
			agencyText					: user.agency,
			title						: user.titleDiffersFromPosition ? user.socialWorkerTitle : user.position,
			position					: user.position,

			phone: {
				work					: user.workPhone,
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
				zipCode					: user.zipCode,
				region 					: user.region
			}

		});

		newUser.save( ( err, model ) => {
			// if there was an issue saving the new site visitor
			if( err ) {
				// reject the promise with a descriptive message
				return reject( `there was an error saving the new social worker model ${ err }` );
			}
			// resolve the promise with the newly saved site visitor model
			resolve( model );
		});
	});
};

exports.saveFamily = user => {

	return new Promise( ( resolve, reject ) => {
		
		const newUser = new Family.model({

			email								: user.email,
			password							: user.password,

			initialContact						: exports.getCurrentDate(),
			language							: user.primaryLanguageInHome,
			otherLanguages						: user.otherLanguagesInHome,

			contact1: {

				name: {
					first						: user.contact1FirstName,
					last						: user.contact1LastName
				},

				phone: {
					mobile						: user.contact1Mobile
				},

				email							: user.contact1Email,
				preferredCommunicationMethod	: user.contact1PreferredCommunicationMethod,
				gender							: user.contact1Gender,
				race							: user.contact1Race,
				occupation						: user.contact1Occupation,
				birthDate						: user.contact1DateOfBirth
			},

			contact2: {
				name: {
					first						: user.contact2FirstName,
					last						: user.contact2LastName
				},

				phone: {
					mobile						: user.contact2Mobile
				},

				email							: user.contact2Email,
				preferredCommunicationMethod	: user.contact2PreferredCommunicationMethod,
				gender							: user.contact2Gender,
				race							: user.contact2Race,
				occupation						: user.contact2Occupation,
				birthDate						: user.contact2DateOfBirth
			},

			address: {
				street1							: user.street1,
				street2							: user.street2,
				isOutsideMassachusetts			: user.isNotMACity,
				city							: user.isNotMACity ? undefined: user.MACity,
				cityText						: user.isNotMACity ? user.nonMACity : '',
				state							: user.state,
				zipCode							: user.zipCode
			},

			homePhone							: user.homePhone,

			stages 								: exports.getStages( user ),

			homestudy: {
				completed						: !user.processProgression ? false : user.processProgression.indexOf( 'homestudyCompleted' ) !== -1,
				initialDate						: !user.processProgression ? undefined : user.processProgression.indexOf( 'homestudyCompleted' ) !== -1 ? user.homestudyDateComplete : undefined
			},

			numberOfChildren					: user.childrenInHome,

			child1                              : exports.setChild( user, 1 ),
			child2                              : exports.setChild( user, 2 ),
			child3                              : exports.setChild( user, 3 ),
			child4                              : exports.setChild( user, 4 ),
			child5                              : exports.setChild( user, 5 ),
			child6                              : exports.setChild( user, 6 ),
			child7                              : exports.setChild( user, 7 ),
			child8                              : exports.setChild( user, 8 ),

			otherAdultsInHome: {
				number							: parseInt( user.otherAdultsInHome, 10 )
			},

			havePetsInHome						: user.havePets === 'yes',

			socialWorkerNotListed				: true,
			socialWorkerText					: user.socialWorkerName,

			matchingPreferences: {
				gender							: user.preferredGender,
				legalStatus						: user.legalStatus,

				adoptionAges: {
					from						: user.ageRangeFrom,
					to							: user.ageRangeTo
				},

				numberOfChildrenToAdopt			: user.numberOfChildrenPrefered ? parseInt( user.numberOfChildrenPrefered, 10 ) : 0,
				siblingContact					: user.contactWithBiologicalSiblings === 'yes',
				birthFamilyContact				: user.contactWithBiologicalParents === 'yes',
				race							: user.adoptionPrefRace,

				maxNeeds: {
					physical					: user.maximumPhysicalNeeds ? user.maximumPhysicalNeeds : 'none',
					intellectual				: user.maximumIntellectualNeeds ? user.maximumIntellectualNeeds : 'none',
					emotional					: user.maximumEmotionalNeeds ? user.maximumEmotionalNeeds : 'none'
				},

				disabilities					: user.disabilities,
				otherConsiderations				: user.otherConsiderations
			},

			heardAboutMAREFrom					: user.howDidYouHear,
			heardAboutMAREOther					: user.howDidYouHearOther,

			registeredViaWebsite				: true
		});

		newUser.save( ( err, model ) => {
			// if there was an issue saving the new site visitor
			if( err ) {
				// reject the promise with a description
				return reject( `there was an error saving the new family model ${ err }` );
			}
			// resolve the promise with the newly saved site visitor model
			resolve( model );
		});
	});
};

/* return true if the submitted email is valid */
exports.validateEmail = email => {

	// a string to validate that an email is valid
	var emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
	// return a check against the passed in email
	return emailPattern.test( email );
};

/* return true if the submitted email already exists in the system for a user of any type */
exports.checkForDuplicateEmail = email => {
	
	// return a promise for cleaner asynchronous processing
	return new Promise( ( resolve, reject ) => {
		// TODO: this exec() is suspicious and different from all my others, it warrants further testing
		// All user types inherit from the User model, so checking User will allow us to accurately check for duplicates
		User.model.findOne()
			.where( 'email', email )
			.exec( ( err, user ) => {
				// if we've found a user with the same email, it's a duplicate
				const isEmailDuplicate = user;

				resolve( isEmailDuplicate );

			}, function( err ) {

				console.log( `error testing for duplicate email in registration` );
				console.log( err );

				reject();
			});
	});
}

/* return true if the submitted 'password' and 'confirm password' match */
exports.validatePassword = ( password, confirmPassword ) => {

	return password === confirmPassword;
};

/* create error flash messages if a problem was encountered */
exports.setInitialErrorMessages = ( req, isEmailValid, isEmailDuplicate, isPasswordValid ) => {
	if( !isEmailValid ) {
		req.flash( `error`, {
				title: `There was a problem creating your account`,
				detail: `The email address you're trying to use is invalid` } );
	}

	if( isEmailDuplicate ) {
		req.flash( `error`, {
				title: `There was a problem creating your account`,
				detail: `The email address you're trying to use already exists in the system` } );
	}

	if( !isPasswordValid ) {
		req.flash( `error`, {
				title: `There was a problem creating your account`,
				detail: `The passwords you entered don't match` } );
	}
};

/* returns an array of staff email contacts */
exports.getRegistrationStaffContactInfo = userType => {

	return new Promise( ( resolve, reject ) => {
		// use the user type to get the staff email target role responsible for handling registration questions
		const emailTarget = userType === 'site visitor' ? 'site visitor registration' :
							userType === 'social worker' ? 'social worker registration' :
							userType === 'family' ? 'family registration' :
							undefined;
		// if the user type was unrecognized, the email target can't be set
		if( !emailTarget ) {
			// reject the promise with details of the issue
			return reject( `unknown user type, staff email contact couldn't be fetched` );
		}
		// TODO: it was nearly impossible to create a readable comma separated list of links in the template with more than one address,
		// 	     so we're only fetching one contact when we should fetch them all
		// get the database id of the admin contact set to handle registration questions for the target user type
		staffEmailTargetMiddleware.getTargetId( emailTarget ).then( targetId => {
			// get the contact details of the admin contact set to thandle registration questions for the target user type
			staffEmailContactMiddleware.getContact( targetId ).then( contactInfo => {
				// resolve the promise with the full name and email address of the contact
				resolve( contactInfo );
			}).catch( reason => {
				// reject the promise with the reason for the rejection
				reject( reason );
			});
		// if there was a problem fetching the email target id
		}).catch( reason => {
			// reject the promise with the reason for the rejection
			reject( reason );
		});
	});
}

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

// TODO: why do we need this, saving a Date object in any Types.Date field should work just fine
exports.getCurrentDate = () => {

	const date = new Date();

	const formattedDate = ( date.getMonth() + 1 ) + '/' + date.getDate() + '/' +  date.getFullYear();
	return formattedDate;
};

exports.setChild = ( user, i ) => {

	let childObject = {};

	if ( user[ 'child' + i + '-name' ] ) {
		childObject.name 		= user[ 'child' + i + '-name' ];
		childObject.birthDate 	= user[ 'child' + i + '-birthDate' ];
		childObject.gender 		= user[ 'child' + i + '-gender' ];
		childObject.type 		= user[ 'child' + i + '-type' ];
	}

	return childObject;
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