const keystone						= require( 'keystone' ),
	  async							= require( 'async' ),
	  childService					= require( './service_child' ),
	  userService 					= require( './service_user' ),
	  registrationService			= require( './service_register' ),
	  registrationEmailMiddleware	= require( './emails_register' ),
	  staffEmailTargetMiddleware	= require( './service_staff-email-target' ),
	  staffEmailContactMiddleware	= require( './service_staff-email-contact' ),
	  utilities         			= require( './utilities' );

exports.setGalleryPermissions = ( req, res, done ) => {

	let locals		= res.locals;
	// variables to determine what features the user has access to.  Don't overwrite it if it's already set
	const userType = locals.userType || ( req.user ? req.user.get( 'userType' ) : 'anonymous' );

	locals.canBookmarkChildren = userType === 'social worker' || userType === 'family' ? true : false;
	locals.canSearchForChildren = userType === 'social worker' || userType === 'family' ? true : false;

	done();
};

exports.checkForBookmarkedChildren = ( req, res, done ) => {

	let locals = res.locals;
	// store the bookmarked children and sibling groups
	const bookmarkedChildren = req.user ? req.user.get( 'bookmarkedChildren' ) : [];
	const bookmarkedSiblings = req.user ? req.user.get( 'bookmarkedSiblings' ) : [];
	// store whether or not the user has any bookmarked children or siblings
	locals.hasBookmarkedChildren = ( bookmarkedChildren && bookmarkedChildren.length > 0 ) ||
								   ( bookmarkedSiblings && bookmarkedSiblings.length > 0 );

	done();
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

/*
 *	Frontend services
 */
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
		// Only add the bookmark if it hasn't already been saved.  This is unlikely, and would require a bad state in the system,
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
		// Only remove the bookmark if it has already been saved.  This is unlikely, and would require a bad state in the system,
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

		const childIds				= locals.children.map( child => child.get( '_id' ).toString() );
		const bookmarkedSiblings	= locals.user.get( 'bookmarkedSiblings' );

		// Only add the bookmark if it hasn't already been saved.  This is unlikely, and would require a bad state in the system, but the check has been added for an extra layer of safety
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

		const childIds				= locals.children.map( child => child.get( '_id' ).toString() );
		const bookmarkedSiblings	= locals.user.get( 'bookmarkedSiblings' );

		for( childId of childIds ) {
			const bookmarkIndex = bookmarkedSiblings.indexOf( childId );
			// Only remove the bookmark if it has already been saved.  This is unlikely, and would require a bad state in the system, but the check has been added for an extra layer of safety
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
	const family = req.body;
	// set the account email to the email for contact 1
	family.email = family.contact1Email;
	// generate a random password hash
	family.password = family.confirmPassword = utilities.generateAlphanumericHash( 20 );
	// families must have their MAPP training completed before this form is submitted, so specify where they are in the process
	family.processProgression = [ 'MAPPTrainingCompleted', 'workingWithAgency', 'lookingForAgency', 'gatheringInformation' ];
    // extract the submitted user information
	const user = req.body;
	// set the redirect URL for use throughout the registration process
	let redirectPath = '/forms/family-registration-form';
	// check for conditions that will prevent saving the model
	const isEmailValid			= registrationService.validateEmail( family.email );
	const fetchDuplicateEmail	= registrationService.checkForDuplicateEmail( family.email ); // returns a promise

	fetchDuplicateEmail.then( isEmailDuplicate => {
		// create an error flash messages if a problem was encountered to let the user know what the problem was
		if( !isEmailValid ) {
			req.flash( `error`, {
					title: `There was a problem creating the family account`,
					detail: `The email address you've listed for contact 1 is invalid` } );
		}

		if( isEmailDuplicate ) {
			req.flash( `error`, {
					title: `There was a problem creating the family account`,
					detail: `The email address you're trying to use already exists in the system` } );
        }
                
		// if initial errors exist, prevent additional processing, alert the user via the flash messages above
		if( !isEmailValid || isEmailDuplicate ) {
			// and redirect to the appropriate page 
			res.redirect( 303, redirectPath );
		// if there were no initial errors, proceed with creating the account
		} else {
            // Store any uploaded files
            // TODO: these still need to be handled
            const files = req.files;
            // save the family model
            registrationService.saveFamily( user ).then( newFamily => {
                // if the new family model was saved successfully
                req.flash( 'success', {
                    title: 'The family account has been successfully created',
                    detail: 'Please note that it can take several days for the account to be reviewed and activated.  The person specified in Contact 1 will receive an email once MARE has had a chance to review their information.' } );
                // create a new random code for the user to verify their account with
                const verificationCode = utilities.generateAlphanumericHash( 35 );
                // store the database id of the newly created user
                const userId = newFamily.get( '_id' );
                // store the user type found in the returned model
                const userType = newFamily.userType;
                // store the host name to link to the verification code in the thank you email
                const host = req.headers.host;
                // create a new verification code model in the database to allow users to verify their accounts
                const createVerificationRecord = registrationService.createNewVerificationModel( verificationCode, userId );
                // fetch contact info for the staff contact for family registration
                const fetchRegistrationStaffContactInfo = registrationService.getRegistrationStaffContactInfo( 'family' );
                // once the contact info has been fetched
                Promise.all( [ createVerificationRecord, fetchRegistrationStaffContactInfo ] ).then( values => {
                    // assign local variables to the values returned by the promises
                    const [ verificationRecord, staffContactInfo ] = values;
                    // send the thank you email to the user
                    const thankYouEmailSentToUser = registrationEmailMiddleware.sendThankYouEmailToUser( staffContactInfo, user.email, userType, verificationCode, host );
                    // TODO: need to send a notification email to the appropriate staff member as well ( check with Lisa to see if this is needed )

                    // save any submitted files and append them to the newly created user
                    const userFilesUploaded = registrationService.uploadFile( newFamily, 'homestudy', 'homestudyFile_upload', files.homestudyFile_upload );
                    // if there was an error sending the thank you email to the new family
                    thankYouEmailSentToUser.catch( reason => {
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
                    title: 'There was an error creating the family account',
                    detail: 'If this error persists, please contact MARE for assistance' } );
                
                res.redirect( 303, redirectPath );
            });
		}
	})
	.catch( reason => {
		
		req.flash( `error`, {
					title: `There was a problem creating the family account`,
					detail: `If the problem persists, please contact MARE for assistance` } );
		
		res.redirect( 303, redirectPath );
	});
};