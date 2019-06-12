const keystone										= require( 'keystone' ),
	  async											= require( 'async' ),
	  listService									= require( '../lists/list.controllers' ),
	  staffEmailContactMiddleware					= require( '../staff email contacts/staff-email-contact.controllers' ),
	  childService									= require( '../children/child.controllers' ),
	  userService 									= require( '../users/user.controllers' ),
	  registrationService							= require( '../../routes/middleware/service_register' ),
	  registrationEmailMiddleware					= require( '../../routes/middleware/emails_register' ),
	  socialWorkerFamilyRegistrationEmailService	= require( '../../routes/middleware/emails_social-worker-family-registration' );
	  utilities         							= require( '../../routes/middleware/utilities' );

/* fetch a single family by their id */
exports.getFamilyById = ( id, fieldsToPopulate = [] ) => {

	return new Promise( ( resolve, reject ) => {
		// if no id was passed in, or the number is invalid
		if( !id ) {
			// log an error for debugging purposes
			console.error( `no _id provided` );
			// reject the promise
			reject();
		}
		// attempt to find a single family matching the passed in id
		keystone.list( 'Family' ).model
			.findById( id )
			.populate( fieldsToPopulate )
			.exec()
			// if the database fetch executed successfully
			.then( family => {
				// if the target family could not be found
				if( !family ) {
					// log an error for debugging purposes
					console.error( `no family matching id '${ id } could be found` );
					// reject the promise
					return reject();
				}
				// if the target family was found, resolve the promise with the lean version of the object
				resolve( family );
			// if there was an error fetching from the database
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching family matching id ${ id }`, err );
				// and reject the promise
				reject();
			});
	});
};

exports.getFamiliesByIds = idsArray => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Family' ).model
			.find()
			.where( '_id' ).in( idsArray )
			.exec()
			.then( families => {
				// if no families were returned
				if( families.length === 0 ) {
					// reject the promise with the reason why
					reject( `error fetching families by id array - no families found with ids ${ idsArray }` );
				}
				// resolve the promise with the returned families
				resolve( families );
			// if an error occurred fetching from the database
			}, err => {
				// reject the promise with details of the error
				reject( `error fetching families by id array ${ idsArray } - ${ err }` );
			});
	});
};

exports.getMaxRegistrationNumber = function() {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Family' ).model
			.findOne()
			.sort( '-registrationNumber' )
			.exec()
			.then( family => {
				if( family ) {
					return resolve( family.get( 'registrationNumber' ) );
				}

				resolve( 0 );
			}, err => {
				reject( new Error( `error fetching maximum registration number for families` ) );
			});
	});
};
// TODO: this has a copy in user.controllers which should be used instead.  This needs to be phased out, but is in use in several places
exports.setGalleryPermissions = ( req, res ) => {

	let locals		= res.locals;
	// variables to determine what features the user has access to.  Don't overwrite it if it's already set
	const userType = locals.userType || ( req.user ? req.user.get( 'userType' ) : 'anonymous' );
	// TODO: all of these checks should be virtuals on the models
	locals.canBookmarkChildren = userType === 'family';
	locals.canSearchForChildren = userType === 'social worker' || userType === 'family';
	// TODO: canViewAllChildren and canSeeAdvancedOptions are the same check and should have a name that encompasses both
	locals.canSeeAdvancedSearchOptions = userType === 'social worker' ||
										 userType === 'admin' ||
									   ( userType === 'family' && req.user.permissions.canViewAllChildren );
};

/* If the user type is capable of bookmarking children on the site, retrieve any that are already bookmarked */
exports.getBookmarkedChildren = ( req, res, done ) => {

	let locals = res.locals;
	// Fetch the user if it has already been retrieved
	if( locals.user === undefined ) {

		const userId = req.user.get( '_id' );

		async.series([
			done => { userService.getUserById( req, res, done, userId ); }
		], () => {
			// store all the bookmarked children and add all the bookmarked siblings
			locals.bookmarkedChildren = locals.user.get( 'bookmarkedChildren' );
			local.bookmarkedChildren.push( ...locals.user.get( 'bookmarkedSiblings' ) );
			// execute done function if async is used to continue the flow of execution
			// TODO: if this is used in non-async middleware, done or next should be passed into options and the appropriate one should be executed
			done();

		});

	} else {

		locals.bookmarkedChildren = locals.user.get( 'bookmarkedChildren' );
		locals.bookmarkedChildren.push( ...locals.user.get( 'bookmarkedSiblings' ) );

		done();
	}
};

/* Frontend services */

exports.addChildBookmark = ( req, res, next ) => {

	let locals					= res.locals;

	const userId				= req.user.get('_id');
	const registrationNumber	= req.body.registrationNumber;

	async.parallel([
		done => { childService.getChildByRegistrationNumber( req, res, done, registrationNumber ); },
		done => { userService.getUserById( req, res, done, userId ); }
	], () => {

		const childId				= locals.child.get( '_id' );
		const bookmarkedChildren	= locals.user.get( 'bookmarkedChildren' );
		// only add the bookmark if it hasn't already been saved.  This is unlikely, and would require a bad state in the system,
		// but the check has been added for an extra layer of safety
		if( bookmarkedChildren.indexOf( childId ) === -1 ) {
			bookmarkedChildren.push( childId );
		}

		locals.user.update( { bookmarkedChildren: bookmarkedChildren }, { multi: false }, ( err, raw ) => {
			if ( err ) {
				console.log( err );
			}

			res.send( 'bookmark added' );

		});
	});
};

exports.removeChildBookmark = ( req, res, next ) => {

	let locals					= res.locals;

	const userId				= req.user.get( '_id' );
	const registrationNumber	= req.body.registrationNumber;

	async.parallel([
		done => { childService.getChildByRegistrationNumber( req, res, done, registrationNumber ); },
		done => { userService.getUserById( req, res, done, userId ); }
	], () => {

		const childId				= locals.child.get( '_id' );
		const bookmarkedChildren	= locals.user.get( 'bookmarkedChildren' );
		const bookmarkIndex			= bookmarkedChildren.indexOf( childId );
		// only remove the bookmark if it has already been saved.  This is unlikely, and would require a bad state in the system,
		// but the check has been added for an extra layer of safety
		if( bookmarkedChildren.indexOf( childId ) !== -1 ) {
			bookmarkedChildren.splice( bookmarkIndex, 1 );
		}

		locals.user.update( { bookmarkedChildren: bookmarkedChildren }, { multi: false }, (err, raw) => {
			if ( err ) {
				console.log( err );
			}

			res.send( 'bookmark removed' );

		});
	});
};

exports.addSiblingGroupBookmark = ( req, res, next ) => {

	let locals					= res.locals;

	const userId				= req.user.get( '_id' );
	const registrationNumbers	= req.body.registrationNumbers.split( ',' );

	async.parallel([
		done => { childService.getChildrenByRegistrationNumbers( req, res, done, registrationNumbers ); },
		done => { userService.getUserById( req, res, done, userId ); }
	], () => {

		const childIds				= locals.children.map( child => child.get( '_id' ) );
		const bookmarkedSiblings	= locals.user.get( 'bookmarkedSiblings' );

		// only add the bookmark if it hasn't already been saved.  This is unlikely, and would require a bad state in the system, but the check has been added for an extra layer of safety
		for ( childId of childIds ) {
			if( bookmarkedSiblings.indexOf( childId ) === -1 ) {
				bookmarkedSiblings.push( childId );
			}
		}

		locals.user.update( { bookmarkedSiblings: bookmarkedSiblings }, { multi: false }, ( err, raw ) => {
			if ( err ) {
				console.log( err );
			}

			res.send( 'bookmark added' );

		});
	});
};

exports.removeSiblingGroupBookmark = ( req, res, next ) => {

	let locals					= res.locals;

	const userId				= req.user.get( '_id' );
	const registrationNumbers	= req.body.registrationNumbers.split( ',' );

	async.parallel([
		done => { childService.getChildrenByRegistrationNumbers( req, res, done, registrationNumbers ); },
		done => { userService.getUserById( req, res, done, userId ); }
	], () => {

		const childIds				= locals.children.map( child => child.get( '_id' ) );
		const bookmarkedSiblings	= locals.user.get( 'bookmarkedSiblings' );

		for( childId of childIds ) {
			const bookmarkIndex = bookmarkedSiblings.indexOf( childId );
			// only remove the bookmark if it has already been saved.  This is unlikely, and would require a bad state in the system, but the check has been added for an extra layer of safety
			if( bookmarkedSiblings.indexOf( childId ) !== -1 ) {
				bookmarkedSiblings.splice( bookmarkIndex, 1 );
			}
		}

		locals.user.update( { bookmarkedSiblings: bookmarkedSiblings }, { multi: false }, (err, raw) => {
			if ( err ) {
				console.log( err );
			}

			res.send( 'bookmark removed' );

		});
	});
};

/* called when a social worker attempts to register a family */
exports.registerFamily = ( req, res, next ) => {
    // extract the submitted user information
	const rawFamilyData = req.body;
	// store a reference to locals to allow access to globally available data
	const locals = res.locals;
	// set the redirect URL for use throughout the registration process
	const redirectPath = '/forms/social-worker-family-registration';
	// set the account email to the email for contact 1
	rawFamilyData.email = rawFamilyData.contact1Email;
	// generate a random password hash
	rawFamilyData.password = rawFamilyData.confirmPassword = utilities.generateAlphanumericHash( 20 );
	// families must have their MAPP training completed before this form is submitted, so specify where they are in the process
	rawFamilyData.processProgression = [ 'MAPPTrainingCompleted', 'workingWithAgency', 'lookingForAgency', 'gatheringInformation' ];
    // extract the information for the social worker submitting the family
	const socialWorker = req.body;
	// check for conditions that will prevent saving the model
	const isEmailValid			= registrationService.validateEmail( rawFamilyData.email );
	const testForDuplicateEmail	= registrationService.checkForDuplicateEmail( rawFamilyData.email ); // returns a promise

	// if we successfully tested for whether the email was a duplicate
	testForDuplicateEmail
		.then( isEmailDuplicate => {
			// if the email was a duplicate
			if( isEmailDuplicate ) {
				// create a generic error flash message to send back to the user
				req.flash( 'error', {
					title: `There was a problem registering this family's homestudy with MARE.`,
					detail: `If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>` });
				// throw an error with details about what went wrong
				throw new Error( 'email for contact 1 is already in use by another user' );
			}
		})
		// if the email wasn't a duplicate
		.then( () => {
			// if the email address for contact 1 is invalid
			if( !isEmailValid ) {
				// throw an error with details to construct a console.error() and flash message
				req.flash( 'error', {
					title: `There was a problem registering this family's homestudy with MARE.`,
					detail: `The email address you've provided for contact 1 is invalid.  If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>` });
				// throw an error with details about what went wrong
				throw new Error( `error creating social worker registered family - email address ${ rawFamilyData.email } is invalid` );
			}
		})
		// if the account email was valid
		.then( () => {
			// TODO: Store any uploaded files
			// const files = req.files;
			// save the family model
			return registrationService.saveFamily( socialWorker )
		})
		// if the family saved successfully
		.then( newFamily => {
			// create a new random code for the user to verify their account with
			const verificationCode = utilities.generateAlphanumericHash( 35 );
			// get the database id of the social worker who submitted the form
			const socialWorkerId = req.user.get( '_id' );
			// store the database id of the newly created user
			const familyId = newFamily.get( '_id' );
			// store the social worker's name
			const socialWorkerName = req.user.get( 'name.full' );
			// store the social worker
			const socialWorkerEmail = req.user.get( 'email' );
			// store the host name to link to the verification code in the thank you email
			const host = req.headers.host;

			// set the fields to populate on the fetched user model
			const fieldsToPopulate = [ 'contact1.gender', 'contact1.race', 'contact2.gender', 'contact2.race',
									   'address.city', 'address.region', 'address.state', 'child1.gender',
									   'child1.type', 'child2.gender', 'child2.type', 'child3.gender',
									   'child3.type', 'child4.gender', 'child4.type', 'child5.gender',
									   'child5.type', 'child6.gender', 'child6.type', 'child7.gender',
									   'child7.type', 'child8.gender', 'child8.type', 'language',
									   'otherLanguages', 'matchingPreferences.gender', 'matchingPreferences.legalStatus',
									   'matchingPreferences.race', 'heardAboutMAREFrom' ];

			// set default information for a staff email contact in case the real contact info can't be fetched
			let staffEmailContactInfo = {
				name: 'MARE',
				email: 'web@mareinc.org'
			};

			// fetch the newly saved family model.  Needed because the saved family object doesn't have the Relationship fields populated
			const fetchFamily = exports.getFamilyById( familyId, fieldsToPopulate );
			// create a new verification code model in the database to allow users to verify their accounts
			const createVerificationRecord = registrationService.createNewVerificationRecord( verificationCode, familyId );
			// fetch the email target model matching 'social worker family registration'
			const fetchEmailTarget = listService.getEmailTargetByName( 'social worker family registration' );

			// save any submitted files and append them to the newly created user
			// TODO: this still need to be implemented when file uploads are added to the system
			// const uploadFamilyFiles = registrationService.uploadFile( newFamily, 'homestudy', 'homestudyFile_upload', files.homestudyFile_upload );

			fetchEmailTarget
				// fetch contact info for the staff contact for 'social worker family registration'
				.then( emailTarget => staffEmailContactMiddleware.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
				// overwrite the default contact details with the returned object
				.then( staffEmailContact => staffEmailContactInfo = staffEmailContact.staffEmailContact )
				// log any errors fetching the staff email contact
				.catch( err => console.error( `error fetching email contact for social worker family registration, default contact info will be used instead`, err ) )
				// check on the attempt to fetch the newly saved family
				.then( () => fetchFamily )
				// send a notification email to MARE
				.then( fetchedFamily => socialWorkerFamilyRegistrationEmailService.sendNewSocialWorkerFamilyRegistrationNotificationEmailToMARE( socialWorkerName, rawFamilyData, fetchedFamily, staffEmailContactInfo, host ) )
				// if there was an error sending the email
				.catch( err => console.error( `error sending new family registered by social worker email to MARE`, err ) )
				// check on the attempt to fetch the newly saved family ( needed again to give us access to the fetched family data at this point in the promise chain )
				.then( () => fetchFamily )
				// send a notification email to the social worker
				.then( fetchedFamily => socialWorkerFamilyRegistrationEmailService.sendNewSocialWorkerFamilyRegistrationNotificationEmailToSocialWorker( socialWorkerName, rawFamilyData, fetchedFamily, socialWorkerEmail, host ) )
				// if there was an error sending the email to the social worker
				.catch( err => console.error( `error sending new family registered by social worker email to social worker ${ req.user.get( 'name.full' ) }`, err ) )
				// check on the attempt to fetch the newly saved family and create the verification record ( needed again to give us access to the fetched family data at this point in the promise chain )
				.then( () => Promise.all( [ fetchFamily, createVerificationRecord ] ) )
				// send a notification email to the family registered by the social worker
				.then( values => {
					// assign local variables to the values returned by the promises
					const [ fetchedFamily, verificationRecord ] = values;
					// send the notification email to family the social worker registered
					return socialWorkerFamilyRegistrationEmailService.sendNewSocialWorkerFamilyRegistrationNotificationEmailToFamily( rawFamilyData, fetchedFamily, staffEmailContactInfo, host, verificationRecord );
				})
				// if there was an error sending the email to the new family
				.catch( err => console.error( `error sending new family registered by social worker email to family ${ newFamily.get( 'displayName' ) }`, err ) );

			// create a success flash message
			req.flash( 'success', {
				title: `Congratulations, the family you submitted has been successfully registered.`,
				detail: `A MARE staff person will be in touch if additional information is needed.` } );
			// redirect the user back to the appropriate page
			res.redirect( 303, redirectPath );
		})
		// if there was an error saving the new family
		.catch( err => {
			// log the error for debugging purposes
			console.error( err.message );
			// throw an error with details to construct a console.error() and flash message
			req.flash( 'error', {
				title: `There was a problem registering this family's homestudy with MARE.`,
				detail: `If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>` });

			res.redirect( 303, redirectPath );
		});
};
