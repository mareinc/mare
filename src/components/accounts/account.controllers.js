// TODO: the saving for each type (child, family, social worker) needs to be moved to the correct file in each respective component
//		 Many of these functions need to be moved to different files, whether component specific, or utilities.

// TODO: these functions are too large and do too many things.  Break them apart if possible

const keystone 						= require( 'keystone' ),
	  accountEmailMiddleware		= require( './account.email.controllers' ),
	  registrationEmailMiddleware	= require( './account.registration-email.controllers' ),
	  listService					= require( '../lists/list.controllers' ),
	  staffEmailContactMiddleware	= require( '../staff email contacts/staff-email-contact.controllers' ),
	  userService					= require( '../users/user.controllers' ),
	  mailchimpService				= require( '../mailchimp lists/mailchimp-list.controllers' ),
	  utilities						= require( '../../routes/middleware/utilities' ),
	  flashMessages					= require( '../../routes/middleware/service_flash-messages' );

exports.registerUser = ( req, res, next ) => {
	// store a reference to locals
	const locals = res.locals;
	// extract the submitted user information
	const user = req.body;
	// store the registration type which determines which path we take during registration
	const registrationType = user.registrationType;
	// create a variable to hold the redirect path to take the user to a target page after processing is complete
	let redirectPath = '/account?newUser=true';
	if (typeof user.redirectUrl !== 'undefined') {
		redirectPath = user.redirectUrl;
	}

	// check for conditions that will prevent saving the model
	const isEmailValid			= exports.validateEmail( user.email ),			// returns true/false
		  fetchDuplicateEmail	= exports.checkForDuplicateEmail( user.email ), // returns a promise
		  isPasswordValid		= exports.validatePassword( user.password, user.confirmPassword ); // returns true/false

	fetchDuplicateEmail
		.then( isEmailDuplicate => {
			// set flash messages for any errors with the email/password information submitted
			exports.setInitialErrorMessages( req, isEmailValid, isEmailDuplicate, isPasswordValid );
			// if initial errors exist, prevent additional processing, alert the user via the flash messages above
			if( !isEmailValid || isEmailDuplicate || !isPasswordValid ) {
				// and send the error status and flash message markup
				flashMessages.generateFlashMessageMarkup()
					.then( flashMessageMarkup => {
						res.send({
							status: 'error',
							flashMessage: flashMessageMarkup
						});
					});
			// if there were no initial errors, proceed with creating the account
			} else {
				if( registrationType === 'siteVisitor' ) {
					// save the site visitor model using the submitted user details
					exports.saveSiteVisitor( user )
						.then( newSiteVisitor => {
							// if the new site visitor model was saved successfully

							// create a new random code for the user to verify their account with
							const verificationCode = utilities.generateAlphanumericHash( 35 );
							// store the database id of the newly created user
							const userId = newSiteVisitor.get( '_id' );
							// store the user type found in the returned model
							const userType = newSiteVisitor.userType;
							// store the array of mailing list ids the user has opted into
							const mailingListIds = user.mailingLists;
							// set the fields to populate on the fetched user model
							const fieldsToPopulate = [ 'address.city', 'address.state', 'heardAboutMAREFrom' ];
							// set default information for a staff email contact in case the real contact info can't be fetched
							let staffEmailContactInfo = {
								name: { full: 'MARE' },
								email: 'web@mareinc.org'
							};

							// fetch the user model.  Needed because the copies we have don't have the Relationship fields populated
							const fetchUser = userService.getUserByIdNew( { id: userId, targetModel: keystone.list( 'Site Visitor' ), fieldsToPopulate } );
							// fetch the email target model matching 'site visitor registration'
							const fetchEmailTarget = listService.getEmailTargetByName( 'site visitor registration' );
							// create a new verification code model in the database to allow users to verify their accounts
							const createVerificationRecord = exports.createNewVerificationRecord( verificationCode, userId );
							// add the user to any mailing lists they've opted into
							const addUserToMailingLists = exports.addToMailingLists( newSiteVisitor, mailingListIds );

							fetchEmailTarget
								// fetch contact info for the staff contact for 'site visitor registration'
								.then( emailTarget => staffEmailContactMiddleware.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
								// overwrite the default contact details with the returned object
								.then( staffEmailContact => staffEmailContactInfo = staffEmailContact.staffEmailContact )
								// log any errors fetching the staff email contact
								.catch( err => console.error( `error fetching email contact for site visitor registration, default contact info will be used instead`, err ) )
								// fetch the user information and whether they were successfully added to each mailing list
								.then( () => Promise.all( [ fetchUser, addUserToMailingLists ] ) )
								// send out the new site visitor registered email to MARE
								.then( values => {
									// assign local variables to the values returned by the promises
									const [ newUser, mailingLists ] = values;
									// fetch the names of the returned mailing lists
									const mailingListNames = mailingLists.map( mailingList => mailingList.name );
									// send a notification email to MARE staff to allow them to enter the information in the old system
									return registrationEmailMiddleware.sendNewSiteVisitorNotificationEmailToMARE( newUser, staffEmailContactInfo, mailingListNames );
								})
								// if the email couldn't be sent, log the error for debugging purposes
								.catch( err => console.error( `error sending new site visitor notification email to MARE contact about ${ newSiteVisitor.get( 'name.full' ) } (${ newSiteVisitor.get( 'email' ) })`, err ) );

							createVerificationRecord
								// send the account verification email to the user
								.then( verificationRecord => accountEmailMiddleware.sendAccountVerificationEmailToUser( newSiteVisitor.get( 'email' ), userType, verificationCode, locals.host ) )
								// if the email couldn't be send, log the error for debugging purposes
								.catch( err => console.error( `error sending account verification email to site visitor ${ newSiteVisitor.get( 'name.full' ) } at ${ newSiteVisitor.get( 'email' ) }`, err ) );

							addUserToMailingLists
								// if the user couldn't be added to one or more mailing lists
								.catch( err => console.error( `error adding new site visitor ${ newSiteVisitor.get( 'name.full' ) } (${ newSiteVisitor.get( 'email' ) }) to mailing lists`, err ) );

							// set the redirect path to the success target route
							req.body.target = redirectPath;
							// pass control to the login middleware
							next();
						})
						// if there was an error saving the new site visitor
						.catch( err => {
							// log the error for debugging purposes
							console.error( `error saving new site visitor`, err );
							// create an error flash message to send back to the user
							flashMessages.appendFlashMessage({
								messageType: flashMessages.MESSAGE_TYPES.ERROR,
								title: 'There was an error creating your account',
								message: 'If this error persists, please contact MARE for assistance'
							});
							// send the error status and flash message markup
							flashMessages.generateFlashMessageMarkup()
								.then( flashMessageMarkup => {
									res.send({
										status: 'error',
										flashMessage: flashMessageMarkup
									});
								});
						});

				} else if( registrationType === 'socialWorker' ) {
					// save the social worker model using the submitted user details
					exports.saveSocialWorker( user )
						.then( newSocialWorker => {
							// if the new social worker model was saved successfully

							// create a new random code for the user to verify their account with
							const verificationCode = utilities.generateAlphanumericHash( 35 );
							// store the database id of the newly created user
							const userId = newSocialWorker.get( '_id' );
							// store the user type found in the returned model
							const userType = newSocialWorker.userType;
							// store the array of mailing list ids the user has opted into
							const mailingListIds = user.mailingLists;
							// set the fields to populate on the fetched user model
							const fieldsToPopulate = [ 'address.city', 'address.state', 'positions' ];
							// set default information for a staff email contact in case the real contact info can't be fetched
							let staffEmailContactInfo = {
								name: { full: 'MARE' },
								email: 'web@mareinc.org'
							};

							// fetch the user model.  Needed because the copies we have don't have the Relationship fields populated
							const fetchUser = userService.getUserByIdNew( { id: userId, targetModel: keystone.list( 'Social Worker' ), fieldsToPopulate } );
							// fetch the email target model matching 'social worker registration'
							const fetchEmailTarget = listService.getEmailTargetByName( 'social worker registration' );
							// create a new verification code model in the database to allow users to verify their accounts
							const createVerificationRecord = exports.createNewVerificationRecord( verificationCode, userId );
							// add the user to any mailing lists they've opted into
							const addUserToMailingLists = exports.addToMailingLists( newSocialWorker, mailingListIds );

							fetchEmailTarget
								// fetch contact info for the staff contact for 'social worker registration'
								.then( emailTarget => staffEmailContactMiddleware.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
								// overwrite the default contact details with the returned object
								.then( staffEmailContact => staffEmailContactInfo = staffEmailContact.staffEmailContact )
								// log any errors fetching the staff email contact
								.catch( err => console.error( `error fetching email contact for social worker registration, default contact info will be used instead`, err ) )
								// fetch the user information and whether they were successfully added to each mailing list
								.then( () => Promise.all( [ fetchUser, addUserToMailingLists ] ) )
								// send out the new social worker registered email to MARE
								.then( values => {
									// assign local variables to the values returned by the promises
									const [ newUser, mailingLists ] = values;
									// fetch the names of the returned mailing lists
									const mailingListNames = mailingLists.map( mailingList => mailingList.name );
									// send a notification email to MARE staff to allow them to enter the information in the old system
									return registrationEmailMiddleware.sendNewSocialWorkerNotificationEmailToMARE( newUser, staffEmailContactInfo, mailingListNames );
								})
								// if the email couldn't be sent, log the error for debugging purposes
								.catch( err => console.error( `error sending new social worker notification email to MARE contact for ${ newSocialWorker.get( 'name.full' ) } (${ newSocialWorker.get( 'email' ) })`, err ) );

							// once the verification record has been saved
							createVerificationRecord
								// send the account verification email to the user
								.then( verificationRecord => accountEmailMiddleware.sendAccountVerificationEmailToUser( newSocialWorker.get( 'email' ), userType, verificationCode, locals.host ) )
								// if the email couldn't be send, log the error for debugging purposes
								.catch( err => console.error( `error sending account verification email to social worker ${ newSocialWorker.get( 'name.full' ) } at ${ newSocialWorker.get( 'email' ) }`, err ) );

							addUserToMailingLists
								// if the user couldn't be added to one or more mailing lists
								.catch( err => console.error( `error adding new social worker ${ newSocialWorker.get( 'name.full' ) } (${ newSocialWorker.get( 'email' ) }) to mailing lists`, err ) );

							// set the redirect path to the success target route
							req.body.target = redirectPath;
							// pass control to the login middleware
							next();
						})
						// if there was an error saving the new social worker
						.catch( err => {
							// log the error for debugging purposes
							console.error( `error saving new social worker`, err );
							// create an error flash message to send back to the user
							flashMessages.appendFlashMessage({
								messageType: flashMessages.MESSAGE_TYPES.ERROR,
								title: 'There was an error creating your account',
								message: 'If this error persists, please contact MARE for assistance'
							});
							// send the error status and flash message markup
							flashMessages.generateFlashMessageMarkup()
								.then( flashMessageMarkup => {
									res.send({
										status: 'error',
										flashMessage: flashMessageMarkup
									});
								});
						});

				} else if ( registrationType === 'family' ) {
					// store any uploaded files
					// TODO: these still need to be handled
					const files = req.files;
					// save the family model
					exports.saveFamily( user )
						.then( newFamily => {
							// if the new family model was saved successfully

							// create a new random code for the user to verify their account with
							const verificationCode = utilities.generateAlphanumericHash( 35 );
							// store the database id of the newly created user
							const userId = newFamily.get( '_id' );
							// store the user type found in the returned model
							const userType = newFamily.userType;
							// store the array of mailing list ids the user has opted into
							const mailingListIds = user.mailingLists;
							// set the fields to populate on the fetched user model
							const fieldsToPopulate = [ 'contact1.gender', 'contact1.race', 'contact2.gender',
													   'contact2.race', 'address.city', 'address.region', 'address.state',
													   'child1.gender', 'child1.type', 'child2.gender', 'child2.type',
													   'child3.gender', 'child3.type', 'child4.gender', 'child4.type',
													   'child5.gender', 'child5.type', 'child6.gender', 'child6.type',
													   'child7.gender', 'child7.type', 'child8.gender', 'child8.type',
													   'language', 'otherLanguages', 'matchingPreferences.gender',
													   'matchingPreferences.legalStatus', 'matchingPreferences.race',
													   'heardAboutMAREFrom' ];
							// set default information for a staff email contact in case the real contact info can't be fetched
							let staffEmailContactInfo = {
								name: { full: 'MARE' },
								email: 'web@mareinc.org'
							};

							// fetch the user model.  Needed because the copies we have don't have the Relationship fields populated
							const fetchUser = userService.getUserByIdNew( { id: userId, targetModel: keystone.list( 'Family' ), fieldsToPopulate } );
							// fetch the email target model matching 'family registration'
							const fetchEmailTarget = listService.getEmailTargetByName( 'family registration' );
							// create a new verification code model in the database to allow users to verify their accounts
							const createVerificationRecord = exports.createNewVerificationRecord( verificationCode, userId );
							// add the user to any mailing lists they've opted into
							const addUserToMailingLists = exports.addToMailingLists( newFamily, mailingListIds );
							// save any submitted files and append them to the newly created user
							// const userFilesUploaded = exports.uploadFile( newFamily, 'homestudy', 'homestudyFile_upload', files.homestudyFile_upload );

							fetchEmailTarget
								// fetch contact info for the staff contact for 'family registration'
								.then( emailTarget => staffEmailContactMiddleware.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
								// overwrite the default contact details with the returned object
								.then( staffEmailContact => staffEmailContactInfo = staffEmailContact.staffEmailContact )
								// log any errors fetching the staff email contact
								.catch( err => console.error( `error fetching email contact for family registration, default contact info will be used instead`, err ) )
								// fetch the user information and whether they were successfully added to each mailing list
								.then( () => Promise.all( [ fetchUser, addUserToMailingLists ] ) )
								// send out the new family registered email to MARE
								.then( values => {
									// assign local variables to the values returned by the promises
									const [ newUser, mailingLists ] = values;
									// fetch the names of the returned mailing lists
									const mailingListNames = mailingLists.map( mailingList => mailingList.name );
									// send a notification email to MARE staff to allow them to enter the information in the old system
									return registrationEmailMiddleware.sendNewFamilyNotificationEmailToMARE( newUser, staffEmailContactInfo, mailingListNames );
								})
								// if the email couldn't be sent, log the error for debugging purposes
								.catch( err => console.error( `error sending new family notification email to MARE contact about ${ newFamily.get( 'displayName' ) } (${ newFamily.get( 'email' ) })`, err ) );

							// once the verification record has been saved
							createVerificationRecord
								// send the account verification email to the user
								.then( verificationRecord => accountEmailMiddleware.sendAccountVerificationEmailToUser( newFamily.get( 'email' ), userType, verificationCode, locals.host ) )
								// if the email couldn't be send, log the error for debugging purposes
								.catch( err => console.error( `error sending account verification email to family ${ newFamily.get( 'displayName' ) } at ${ newFamily.get( 'email' ) }`, err ) );

							addUserToMailingLists
								// if the user couldn't be added to one or more mailing lists
								.catch( err => console.error( `error adding new family ${ newFamily.get( 'displayName' ) } (${ newFamily.get( 'email' ) }) to mailing lists`, err ) );

							// set the redirect path to the success target route
							req.body.target = redirectPath;
							// pass control to the login middleware
							next();
						})
						// if there was an error saving the new family
						.catch( err => {
							// log the error for debugging purposes
							console.error( `error saving new family`, err );
							// create an error flash message to send back to the user
							flashMessages.appendFlashMessage({
								messageType: flashMessages.MESSAGE_TYPES.ERROR,
								title: 'There was an error creating your account',
								message: 'If this error persists, please contact MARE for assistance'
							});
							// send the error status and flash message markup
							flashMessages.generateFlashMessageMarkup()
								.then( flashMessageMarkup => {
									res.send({
										status: 'error',
										flashMessage: flashMessageMarkup
									});
								});
						});
				}
			}
		})
		.catch( reason => {

			// create an error flash message to send back to the user
			flashMessages.appendFlashMessage({
				messageType: flashMessages.MESSAGE_TYPES.ERROR,
				title: 'There was an error creating your account',
				message: 'If this error persists, please contact MARE for assistance'
			});
			// send the error status and flash message markup
			flashMessages.generateFlashMessageMarkup()
				.then( flashMessageMarkup => {
					res.send({
						status: 'error',
						flashMessage: flashMessageMarkup
					});
				});
		});
};

exports.saveSiteVisitor = user => {

	return new Promise( ( resolve, reject ) => {

		const SiteVisitor = keystone.list( 'Site Visitor' );

		// create a new site visitor model with the passed in data
		let newUser = new SiteVisitor.model({

			isActive					: true,

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
				city					: user.isNotMACity ? undefined : user.city,
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
				return reject( new Error( `error saving new site visitor` ) );
			}
			// resolve the promise with the newly saved site visitor model
			resolve( model );
		});
	});
};

exports.saveSocialWorker = user => {

	return new Promise( ( resolve, reject ) => {

		const SocialWorker = keystone.list( 'Social Worker' );

		const newUser = new SocialWorker.model({

			isActive					: true,

			name: {
				first					: user.firstName,
				last					: user.lastName
			},

			password					: user.password,
			email						: user.email,
			agencyNotListed				: true,
			agencyText					: user.agency,
			positions					: user.positions,
			title						: user.socialWorkerTitle,

			phone: {
				work					: user.workPhone,
				mobile					: user.mobilePhone,
				preferred 				: user.preferredPhone
			},

			address: {
				street1					: user.street1,
				street2					: user.street2,
				isOutsideMassachusetts	: user.isNotMACity,
				city					: user.isNotMACity ? undefined : user.city,
				cityText				: user.isNotMACity ? user.nonMACity : '',
				state					: user.state,
				zipCode					: user.zipCode
			}
		});

		newUser.save( ( err, model ) => {
			// if there was an issue saving the new site visitor
			if( err ) {
				// reject the promise with a descriptive message
				return reject( new Error( `error saving new social worker` ) );
			}
			// resolve the promise with the newly saved site visitor model
			resolve( model );
		});
	});
};

exports.saveFamily = user => {

	return new Promise( ( resolve, reject ) => {

		const Family = keystone.list( 'Family' );

		const newUser = new Family.model({

			isActive							: true,

			email								: user.email,
			password							: user.password,

			initialContact						: exports.getCurrentDate(),
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
				city							: user.isNotMACity ? undefined: user.city,
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

			child1                              : exports.setChild( user, 1 ),
			child2                              : exports.setChild( user, 2 ),
			child3                              : exports.setChild( user, 3 ),
			child4                              : exports.setChild( user, 4 ),
			child5                              : exports.setChild( user, 5 ),
			child6                              : exports.setChild( user, 6 ),
			child7                              : exports.setChild( user, 7 ),
			child8                              : exports.setChild( user, 8 ),

			otherAdultsInHome: {},

			havePetsInHome						: user.havePets,

			socialWorkerNotListed				: true,
			socialWorkerText					: user.socialWorkerName,

			matchingPreferences: {
				gender							: user.preferredGender,
				legalStatus						: user.legalStatus,

				adoptionAges: {
					from						: user.ageRangeFrom,
					to							: user.ageRangeTo
				},

				siblingContact					: user.contactWithBiologicalSiblings === 'yes' ? true :
												  user.contactWithBiologicalSiblings === 'no' ? false :
												  undefined,
				birthFamilyContact				: user.contactWithBiologicalParents === 'yes' ? true :
												  user.contactWithBiologicalParents === 'no' ? false :
												  undefined,
				race							: user.adoptionPrefRace,

				maxNeeds: {
					physical					: user.maximumPhysicalNeeds ? user.maximumPhysicalNeeds : undefined,
					intellectual				: user.maximumIntellectualNeeds ? user.maximumIntellectualNeeds : undefined,
					emotional					: user.maximumEmotionalNeeds ? user.maximumEmotionalNeeds : undefined
				},

				disabilities					: user.disabilities,
				otherConsiderations				: user.otherConsiderations
			},

			heardAboutMAREFrom					: user.howDidYouHear,
			heardAboutMAREOther					: user.howDidYouHearOther,

			registeredViaWebsite				: true
		});

		if( user.numberOfChildrenFrom ) {
			newUser.set( 'matchingPreferences.minNumberOfChildrenToAdopt', parseInt( user.numberOfChildrenFrom, 10 ) );
		}

		if( user.numberOfChildrenTo ) {
			newUser.set( 'matchingPreferences.maxNumberOfChildrenToAdopt', parseInt( user.numberOfChildrenTo, 10 ) );
		}

		if ( user.primaryLanguageInHome ) {
			newUser.set( 'language', user.primaryLanguageInHome );
		}

		if( user.childrenInHome !== '' ) {
			newUser.set( 'numberOfChildren', parseInt( user.childrenInHome ) );
		}

		if ( user.otherAdultsInHome !== '' ) {
			newUser.set( 'otherAdultsInHome.number', parseInt( user.otherAdultsInHome, 10 ) );
		}

		newUser.save( ( err, model ) => {
			// if there was an issue saving the new site visitor
			if( err ) {
				// reject the promise with a description
				return reject( new Error( `error saving new family` ) );
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
		keystone.list( 'User' ).model
			.findOne()
			.where( 'email', email )
			.exec()
			.then( user => {
				// if we've found a user with the same email, it's a duplicate
				const isEmailDuplicate = !!user;

				resolve( isEmailDuplicate );

			}, err => {

				console.error( `error testing for duplicate email`, err );

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
		flashMessages.appendFlashMessage({
			messageType: flashMessages.MESSAGE_TYPES.ERROR,
			title: `There was a problem creating your account`,
			message: `The email address you're trying to use is invalid`
		});
	}

	if( isEmailDuplicate ) {
		flashMessages.appendFlashMessage({
			messageType: flashMessages.MESSAGE_TYPES.ERROR,
			title: `There was a problem creating your account`,
			message: `The email you are trying to use already exists in the system. Please reset your password for this email address in order to gain access. If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>`
		});
	}

	if( !isPasswordValid ) {
		flashMessages.appendFlashMessage({
			messageType: flashMessages.MESSAGE_TYPES.ERROR,
			title: `There was a problem creating your account`,
			message: `The passwords you entered don't match`
		});
	}
};

/* add the passed in user to the emails specified in the mailingListIds array */
exports.addToMailingLists = ( user, mailingListIds ) => {

	return new Promise( ( resolve, reject ) => {
		// filter out any invalid strings.  False values from form submissions will result in an empty string
		const validMailingListIds = mailingListIds ?
									mailingListIds.filter( ( mailingListId ) => mailingListId !== '' ) :
									undefined;
		// if there were no mailing lists the user opted into
		if( !validMailingListIds || validMailingListIds.length === 0 ) {
			// resolve the promise with an empty array as it's meant to represent the absence of mailing lists which would normally be returned in array
			return resolve( [] );
		}

		// create an array to hold the subscribed mailing lists so the final link in the promise chain can be resolved with their names
		let subscribedMailingLists = [];

		// retrieve all mailing lists the user opted in to using their id
		Promise.all(
			validMailingListIds.map( mailingListId =>
				keystone.list( 'Mailchimp List' ).model
					.findById( mailingListId )
					.exec()
			)
		)
		// once all mailing lists have been retrieved
		.then( mailingListDocs => {
			// store the mailing lists for access further down the chain
			subscribedMailingLists = mailingListDocs;
			// add the user to each mailing list via the Mailchimp API
			return Promise.all(
				mailingListDocs.map( mailingList => mailchimpService.subscribeMemberToList({
					email: user.email,
					mailingListId: mailingList.mailchimpId,
					userType: user.userType,
					firstName: user.userType === 'family'
						? user.contact1.name.first
						: user.name.first,
					lastName: user.userType === 'family'
						? user.contact1.name.last
						: user.name.last
				}))
			);
		// once the user has been added to the Mailchimp mailing lists
		}).then( () => {
			// save a reference to each mailing list the user subscribed to
			user.mailingLists = validMailingListIds;
			return user.save();
		// once the user model has been updated with their mailing list subscriptions
		}).then( () => {
			// resolve the promise with mailing lists the user has subscribed to
			resolve( subscribedMailingLists );
		// if any error were encountered
		}).catch( err => {
			// reject the promise with the reason
			reject( err );
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
	// 				console.log( `error fetching user to save file attachment`, err );

	// 				done();
	// 			});
};

// TODO: why do we need this, saving a Date object in any Types.Date field should work just fine
exports.getCurrentDate = () => {

	const date = new Date();

	const formattedDate = `${ date.getMonth() + 1 }/${ date.getDate() }/${ date.getFullYear() }`;
	return formattedDate;
};

exports.setChild = ( user, i ) => {

	let childObject = {};

	if ( user[ `child${ i }-name` ] ) {
		childObject.name 		= user[ `child${ i }-name` ];
		childObject.birthDate 	= user[ `child${ i }-birthDate` ];
		childObject.gender 		= user[ `child${ i }-gender` ];
		childObject.type 		= user[ `child${ i }-type` ];
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

exports.createNewVerificationRecord = ( verificationCode, userId ) => {

	return new Promise( ( resolve, reject ) => {

		const AccountVerificationCode = keystone.list( 'Account Verification Code' );

		// create the new verification model
		const newVerificationCodeModel = new AccountVerificationCode.model({
			code	: verificationCode,
			user	: userId,
			dateSent: new Date()
		});
		// attempt to save the new verification model
		newVerificationCodeModel.save( ( err, model ) => {
			// if there was an error saving the new model to the database
			if( err ) {
				// reject the promise with the reason for the rejection
				return reject( new Error( `error saving new verification code model for user with id ${ userId }` ) );
			}
			// if the model saved successfully, resolve the promise, returning the newly saved model
			resolve( model );
		});
	});
};
