// TODO: This is a big one.  Review all middleware and come up with a better division of labor.  All email sending in email_ middleware
//		 but we might want to find a better separation of concerns for fetching model data, modifying models, and utility functions to make
//		 all these middleware files more readable and maintainable.  This involves a review of every middleware function.

// TODO: consider converting all done() to return done() for safety reasons
const keystone 						= require( 'keystone' );
const async 						= require( 'async' );
const _ 							= require( 'underscore' );
const randomString					= require( 'randomstring' );
const User							= keystone.list( 'User' );
const SiteVisitor 					= keystone.list( 'Site Visitor' );
const SocialWorker 					= keystone.list( 'Social Worker' );
const Family						= keystone.list( 'Family' );
const StaffEmailContact				= keystone.List( 'Staff Email Contact' );
const MailingList					= keystone.list( 'Mailing List' );
const AccountVerificationCode		= keystone.list( 'Account Verification Code' );
const registrationEmailMiddleware	= require( './emails_register' );
const staffEmailTargetMiddleware	= require( './service_staff-email-target' );
const staffEmailContactMiddleware	= require( './service_staff-email-contact' );

exports.registerUser = ( req, res, next ) => {

	const user = req.body;

	let locals = res.locals;
	
	let files;

	// Initialize validation checks to failing values to ensure they actually pass all checks
	locals.isEmailInvalid		= true;
	locals.isEmailDuplicate		= true;
	locals.isPasswordInvalid	= true;
	// Capture the registration type which determines which path we take during registration
	locals.registrationType = user.registrationType;
	// TODO: add default case and error handling
	// Set the user type and redirect URL for use throughout the registration process
	switch( locals.registrationType ) {
		case 'siteVisitor':
			locals.userModel = SiteVisitor;
			locals.redirectPath = '/register#site-visitor';
			break;
		case 'socialWorker':
			locals.userModel = SocialWorker;
			locals.redirectPath = '/register#social-worker';
			break;
		case 'family':
			locals.userModel = Family;
			locals.redirectPath = '/register#family';
	}
	// TODO: Remove this line, it's just for debugging
	console.log( `registration type: ${ locals.registrationType }` );

	async.parallel([
		done => { exports.validateEmail( req, res, user.email, done ); },
		done => { exports.checkForDuplicateEmail( req, res, user.email, done ); },
		done => { exports.validatePassword( req, res, user.password, user.confirmPassword, done ); }
	], () => {
		if( locals.isEmailInvalid ) { locals.messages.push( { type: 'error', message: 'email is invalid' } ); }
		if( locals.isEmailDuplicate ) { locals.messages.push( { type: 'error', message: 'email already exists in the system' } ); }
		if( locals.isPasswordInvalid ) { locals.messages.push( { type: 'error', message: 'passwords don\'t match' } ); }

		console.log( locals.messages );
		// TODO: Add check for required fields
		if( locals.messages.length > 0 ) {
			// TODO: send the error messages as flash messages
			res.redirect( 303, locals.redirectPath );
		} else {
			if( locals.registrationType === 'siteVisitor' ) {

				async.series([
					done => { exports.saveSiteVisitor( req, res, user, done ); }
				], () => {
					res.redirect( 303, locals.redirectPath );
					 // TODO: Post a success or error flash message
				});

			} else if( locals.registrationType === 'socialWorker' ) {

				async.series([
					done => { exports.getMailingLists( req, res, done ); },
					done => { exports.saveSocialWorker( req, res, user, done ); },
					done => { exports.getUserID( req, res, user, locals.userModel, done ); },
					done => { exports.addToMailingLists( req, res, user, done ); }
				], () => {
					res.redirect( 303, locals.redirectPath );
					 // TODO: Post a success or error flash message
				});

			} else if ( locals.registrationType === 'family' ) {
				// Store any uploaded files
			    locals.files = req.files;

				async.series([
					done => { exports.getMailingLists( req, res, done ); },
					done => { exports.getNextRegistrationNumber( req, res, done ); },
					done => { exports.saveFamily( req, res, user, done ); },
					done => { exports.getUserID( req, res, user, locals.userModel, done ); },
					done => { exports.uploadFile( req, res, locals.userModel, 'homestudy', 'homestudyFile_upload', locals.files.homestudyFile_upload, done ); },
					done => { exports.addToMailingLists( req, res, user, done ); }
				], () => {
					res.redirect( 303, locals.redirectPath );
					 // TODO: Post a success or error flash message
				});
			}
		}
	});

};

exports.saveSiteVisitor = ( req, res, user, done ) => {

	let locals = res.locals;

	var newUser = new SiteVisitor.model({

		name: {
			first			: user.firstName,
			last			: user.lastName
		},

		password			: user.password,
		email				: user.email,

		phone: {
			work			: user.workPhone,
			home			: user.homePhone,
			mobile			: user.mobilePhone,
			preferred 		: user.preferredPhone
		},

		address: {
			street1			: user.street1,
			street2			: user.street2,
			city			: user.city,
			state			: user.state,
			zipCode			: user.zipCode
		},

		infoPacket: {
			packet			: user.infoPacket === 'yes' ? user.infoPacketLanguage : 'none'
		},

		heardAboutMAREFrom 	: user.howDidYouHear,
		heardAboutMAREOther	: user.howDidYouHearOther

	});
	// TODO: revisit this to see which function errors are processed through and clean up the handlers below
	newUser.save( ( err, model ) => {
		if( err ) {
			console.log( err );
			locals.messages.push( { type: `error`, message: `there was an error creating your account` } );
			return done();
		}

		locals.messages.push( { type: `success`, message: `Congratulations, your account has been successfully created` } );
		// create a new random code for the user to verify their account with
		const verificationCode = randomString.generate( { length: 35, charset: 'alphanumeric' } );
		// store the user type found in the returned model
		const userType = model.userType;
		// store the host name to link to the verification code in the thank you email
		const host = req.headers.host;

		async.series([
			// create a verification code record for the newly created user
			done => { exports.createNewVerificationCodeRecord( verificationCode, newUser._id, done ); },
			done => { exports.getRegistrationStaffContactInfo( req, res, 'site visitor', done ) },
			done => { registrationEmailMiddleware.sendThankYouEmailToUser( locals.staffContactName, locals.staffContactEmail, user.email, userType, verificationCode, host, done ); }
		], () => {
			// TODO: if the user requested an email of the info packet, send it
			// TODO: if the user requested a mail copy of the info packet, add it to an object containing email information before sending it to Diane
			//       so we can capture all relevant information in one email
			done();
		});
	});
};

exports.saveSocialWorker = ( req, res, user, done ) => {

	let locals = res.locals;

	const newUser = new SocialWorker.model({

		name: {
			first			: user.firstName,
			last			: user.lastName
		},

		password			: user.password,
		email				: user.email,
		agencyNotListed		: true,
		agencyText			: user.agency,
		title				: user.titleDiffersFromPosition ? user.socialWorkerTitle : user.position,
		position			: user.position,

		phone: {
			work			: user.workPhone,
			mobile			: user.mobilePhone,
			preferred 		: user.preferredPhone
		},

		address: {
			street1			: user.street1,
			street2			: user.street2,
			city			: user.city,
			state			: user.state,
			zipCode			: user.zipCode,
			region 			: user.region
		}

	});

	newUser.save( ( err, model ) => {
		if( err ) {
			console.log( err );
			locals.messages.push( { type: `error`, message: `there was an error creating your account` });
		} else {
			console.log( `new social worker saved` );
			locals.messages.push( { type: `success`, message: `your social worker account has been successfully created` } );
		}
		done();
	});
};

exports.saveFamily = ( req, res, user, done ) => {

	let locals = res.locals;

	const newUser = new Family.model({

		email								: user.email,
		password							: user.password,
		registrationNumber					: locals.newRegistrationNumber,

		initialContact						: exports.getCurrentDate(),
		familyConstellation					: user.familyConstellation,
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
			city							: user.city,
			state							: user.state,
			zipCode							: user.zipCode
		},

		homePhone							: user.homePhone,

		stages 								: exports.getStages( user ),

		homestudy: {
			completed						: !user.processProgression ? false : user.processProgression.indexOf( 'homestudyCompleted' ) !== -1 ? true : false,
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

		havePetsInHome						: user.havePets === 'yes' ? true : false,

		socialWorkerNotListed				: true,
		socialWorkerText					: user.socialWorkerName,

		infoPacket: {
			packet							: user.infoPacket === 'yes' ? user.infoPacketLanguage : 'none'
		},

		matchingPreferences: {
			gender							: user.preferredGender,
			legalStatus						: user.legalStatus,

			adoptionAges: {
				from						: user.ageRangeFrom,
				to							: user.ageRangeTo
			},

			numberOfChildrenToAdopt			: parseInt( user.numberOfChildrenPrefered, 10 ),
			siblingContact					: user.contactWithBiologicalSiblings === 'yes' ? true : false,
			birthFamilyContact				: user.contactWithBiologicalParents === 'yes' ? true : false,
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
		if( err ) {
			console.log( err );
			locals.messages.push( { type: `error`, message: `there was an error creating your account` } );
		} else {
			// TODO: if the user requested an email of the info packet, send it
			// TODO: if the user requested a mail copy of the info packet, add it to an object containing email information before sending it to Diane
			//       so we can capture all relevant information in one email
			console.log( `new family saved` );
			locals.messages.push( { type: `success`, message: `your account has been successfully created` } );
		}
		
		done();
	});
}

/* New user data validation functions */
// Return true if the submitted email is valid
exports.validateEmail = ( req, res, email, done ) => {

	let locals = res.locals;

	var emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/; // A string to validate that an email is valid
	locals.isEmailInvalid = !emailPattern.test( email ); // We want to know if the email is invalid, so we need to take the inverse of the test result

	done();
};
// Return true if the submitted email already exists in the system for a user of any type
exports.checkForDuplicateEmail = ( req, res, email, done ) => {

	let locals = res.locals;
	// TODO: this exec() is suspicious and different from all my others, it warrants further testing
	// All user types inherit from the User model, so checking User will allow us to accurately check for duplicates
	User.model.findOne()
		.where( 'email', email )
		.exec( ( err, user ) => {

			locals.isEmailDuplicate = user ? true : false;
			done();

		}, function( err ) {

			console.log( `error testing for duplicate email in registration` );
			console.log( err );
			done();

		});
}

// Return true if the submitted 'password' and 'confirm password' match
exports.validatePassword = ( req, res, password, confirmPassword, done ) => {

	let locals = res.locals;

	locals.isPasswordInvalid = password !== confirmPassword;
	done();

};

exports.getUserID = ( req, res, user, userModel, done ) => {

	let locals = res.locals;

	const email = user.email;
	// TODO: this exec() is suspicious and different from all my others, it warrants further testing
	userModel.model.findOne( { email: email } )
			.exec(function ( err, user ) {
				locals.newUserID = user._id;
				done();
			});

};

/* sets an array of staff email contacts on locals.staffContactEmails */
exports.getRegistrationStaffContactInfo = ( req, res, userType, done ) => {

	let locals = res.locals;

	const emailTarget = userType === 'site visitor' ? 'site visitor registration' :
						userType === 'social worker' ? 'social worker registration' :
						userType === 'family' ? 'family registration' :
						undefined;

	if( !emailTarget ) {
		console.error( `unknown user type, staff email contact couldn't be fetched` );
	}

	async.series([
		done => { staffEmailTargetMiddleware.getTargetId( req, res, emailTarget, done ); },
		done => { staffEmailContactMiddleware.getContact( req, res, locals.emailTargetId, done ); } // TODO: this is kludgy and wrong, it was nearly impossible to create a readable comma separated list of links in the template with more than one address, so we're only fetching one contact
	], () => {
		done();
	});
}

// TODO: URGENT, this will break across environments, need to find a better way to bind to mailing lists
exports.addToMailingLists = ( req, res, user, done ) => {

	res.locals.requestedMailingLists = [];

	if( user.mareEmailList === 'yes' ) { res.locals.requestedMailingLists.push( 'news' ); }
	if( user.adoptionPartyEmailList === 'yes' ) { res.locals.requestedMailingLists.push( 'adoption parties' ); }
	if( user.fundraisingEventsEmailList === 'yes' ) { res.locals.requestedMailingLists.push( 'fundraising' ); }
	// Loop through each of the mailing lists the user should be added to and add them.  Async allows all assignments
	// to happen in parallel before handling the result.
	async.each( res.locals.requestedMailingLists, ( listName, callback ) => {

		MailingList.model.findById( res.locals.mailingLists[ listName ] )
				.exec()
				.then( result => {

					if( res.locals.registrationType === 'socialWorker' ) {
						result.socialWorkerSubscribers.push( res.locals.newUserID );
					} else if ( res.locals.registrationType === 'family' ) {
						result.familySubscribers.push( res.locals.newUserID );
					}

					result.save( ( err, model ) => {
						if( err ) {
							console.log( err );
						} else {
							console.log( `user saved to ${ listName } list` );
						}

						callback();
					});

				}, err => {
					console.log( err );
					callback();
				});

	}, err => {
			// if any of the file processing produced an error, err would equal that error
			if( err ) {
				// One of the iterations produced an error.
				// All processing will now stop.
				console.log( `an error occurred saving the user to one or more mailing lists: ${ err }` );
				done();
			} else {
				console.log( `user saved to all email lists successfully` );
				done();
			}
	});
};

exports.uploadFile = ( req, res, userModel, targetFieldPrefix, targetField, file, done ) => {

	// TODO: however this will be done, we need to check to see if the file object is stored, if not, we can ignore this whole function
	userModel.model.findById( res.locals.newUserID )
				.exec()
				.then( user => {
					console.log( 'file' );
					console.log( file );

					user[ targetFieldPrefix ][ targetField ] = file;

					user.save( ( err, model ) => {
						console.log( `file saved for the user` );
						done();
					});

				}, err => {
					console.log( `error fetching user to save file attachment: ${ err }` );
					done();
				});
};

exports.getMailingLists = ( req, res, done ) => {

	let locals = res.locals;
	res.locals.mailingLists = {};

	MailingList.model.find()
			.where( 'mailingList' ).in( [ 'news', 'adoption parties', 'fundraising' ] )
			.exec()
			.then( mailingLists => {

				mailingLists.map( mailingList => {
					res.locals.mailingLists[ mailingList.get( 'mailingList' ) ] = mailingList.get( '_id' );
				});

				done();

			}, err => {
				console.log( err );
				done();
			});
};

exports.getNextRegistrationNumber = ( req, res, done ) => {

	let locals = res.locals;
	
	Family.model.find()
			.select( 'registrationNumber' )
			.exec()
			.then( families => {
				// get an array of registration numbers
				const registrationNumbers = families.map( family => family.get( 'registrationNumber' ) );
				// get the largest registration number
				locals.newRegistrationNumber = Math.max( ...registrationNumbers ) + 1;

				done();

			}, err => {
				console.log( 'error setting registration number' );
				console.log( err );

				done();
			});
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

exports.createNewVerificationCodeRecord = ( verificationCode, userId, done ) => {
	
	var newVerificationCodeRecord = new AccountVerificationCode.model({
		code	: verificationCode,
		user	: userId,
		dateSent: new Date()
	});

	newVerificationCodeRecord.save( ( err, model ) => {
		console.log( `verification code entry created` );
		done();
	});
};