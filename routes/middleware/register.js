var keystone 		= require('keystone'),
	async 			= require('async'),
	_ 				= require('underscore'),
	SiteUser 		= keystone.list('Site User'),
	SocialWorker 	= keystone.list('Social Worker'),
	MailingList		= keystone.list('Mailing List');

exports.registerUser = function(req, res, next) {

	var user = req.body;

	// Initialize validation checks to failing values to ensure they actually pass all checks
	res.locals.isEmailInvalid			= true,
	res.locals.isEmailDuplicate			= true,
	res.locals.isPasswordInvalid		= true;
	// Capture the registration type which determines which path we take during registration
	res.locals.registrationType = user.registrationType;
	// Set the user type and redirect URL for use throughout the registration process
	switch(res.locals.registrationType) {
		case 'siteVisitor':
			res.locals.userType = SiteUser;
			res.locals.redirectPath = '/register#site-visitor';
			break;
		case 'socialWorker':
			res.locals.userType = SocialWorker;
			res.locals.redirectPath = '/register#social-worker';
			break;
		case 'prospectiveParent':
			res.locals.userType = ProspectiveParentOrFamily;
			res.locals.redirectPath = '/register#family';
	}
	// TODO: Remove this line, it's just for debugging
	console.log('registration type: ' + res.locals.registrationType);

	async.parallel([
		function(done) { exports.validateEmail(user.email, res, done); },
		function(done) { exports.checkForDuplicateEmail(user.email, res.locals.userType, res, done); },
		function(done) { exports.validatePassword(user.password, user.confirmPassword, res, done); }
	], function() {
		if(res.locals.isEmailInvalid) { res.locals.messages.push({ type: 'error', message: 'email is invalid' }); }
		if(res.locals.isEmailDuplicate) { res.locals.messages.push({ type: 'error', message: 'email already exists in the system' }); }
		if(res.locals.isPasswordInvalid) { res.locals.messages.push({ type: 'error', message: 'passwords don\'t match' }); }

		console.log(res.locals.messages);
		// TODO: Add check for required fields
		if(res.locals.messages.length > 0) {
			// TODO: send the error messages as flash messages
			res.redirect(res.locals.redirectPath);
		} else {
			if(res.locals.registrationType === 'siteVisitor') {
				async.series([
					function(done) { exports.saveSiteVisitor(user, res, done); }
				], function() {
					res.redirect(res.locals.redirectPath);
					 // TODO: Post a success or error flash message
				});
			} else if (res.locals.registrationType === 'socialWorker') {
				async.series([
					function(done) { exports.saveSocialWorker(user, res, done); },
					function(done) { exports.getUserID(user, SocialWorker, res, done); },
					function(done) { exports.addToMailingLists(user, SocialWorker, res, done); }
				], function() {
					res.redirect(res.locals.redirectPath);
					 // TODO: Post a success or error flash message
				});
			} else if (res.locals.registrationType === 'prospectiveParent') {
				console.log('TODO: make a new prospective parent');
			}
		}
	});

};

exports.saveSiteVisitor = function saveSiteVisitor(user, res, done) {

	var newUser = new SiteUser.model({

		name: {
			first			: user.firstName,
			last			: user.lastName
		},

		password			: user.password,
		email				: user.email,

		phone: {
			work			: user.workPhone,
			home			: user.homePhone,
			cell			: user.mobilePhone,
			preferred 		: user.preferredPhone
		},

		address: {
			street1			: user.street1,
			street2			: user.street2,
			city			: user.city,
			state			: user.state,
			zipCode			: user.zipCode
		},

		heardAboutMAREFrom 	: user.howDidYouHear,
		heardAboutMAREOther	: user.howDidYouHearOther

	});

	newUser.save(function(err) {
		res.locals.messages.push({ type: 'success', message: 'your site visitor account has been successfully created' });
		done();
	}, function(err) {
		console.log(err);
		res.locals.messages.push({ type: 'error', message: 'there was an error creating your account' });
		done();
	});

};

exports.saveSocialWorker = function saveSocialWorker(user, res, done) {

	var newUser = new SocialWorker.model({

		name: {
			first			: user.firstName,
			last			: user.lastName
		},

		password			: user.password,
		email				: user.email,
		agencyNotListed		: true,
		agencyText			: user.agency,
		title				: user.socialWorkerTitle,
		position			: user.position,

		phone: {
			work			: user.workPhone,
			cell			: user.mobilePhone,
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

	newUser.save(function(err) {
		console.log('new social worker saved');
		res.locals.messages.push({ type: 'success', message: 'your social worker account has been successfully created' });
		done();
	}, function(err) {
		console.log(err);
		res.locals.messages.push({ type: 'error', message: 'there was an error creating your account' });
		done();
	});

};

/* New user data validation functions */
// Return true if the submitted email is valid
exports.validateEmail = function validateEmail(email, res, done) {

	var emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/; // A string to validate that an email is valid
	res.locals.isEmailInvalid = !emailPattern.test(email); // We want to know if the email is invalid, so we need to take the inverse of the test result

	done();

};
// Return true if the submitted email already exists in the system
// TODO: This doesn't return in time for the above check and users with duplicate emails are allowed to be created
// TODO: We need to verify that no user anywhere in the system is registered with that email, not just the user type they are trying to create
exports.checkForDuplicateEmail = function checkForDuplicateEmail(email, userType, res, done) {

	userType.model.findOne()
		.where('email', email)
		.exec(function (err, user) {

			res.locals.isEmailDuplicate = user ? true : false;
			done();

		}, function(err) {

			console.log('error testing for duplicate email in registration');
			console.log(err);
			done();

		});
}

// Return true if the submitted 'password' and 'confirm password' match
exports.validatePassword = function validatePassword(password, confirmPassword, res, done) {

	res.locals.isPasswordInvalid = password !== confirmPassword;
	done();

};

exports.getUserID = function getUserID(user, userType, res, done) {
	var email = user.email;

	userType.model.findOne({ email }).exec(function (err, user) {
		res.locals.newUserID = user._id;
		done();
	});

};

exports.addToMailingLists = function addToMailingLists(user, userType, res, done) {
	res.locals.mailingLists = {
		news			: '5692fcc6eb0d8a13f5f5ecc7',
		adoptionParties	: '569806f50151ac0300616ca0',
		fundraising		: '5692fcc6eb0d8a13f5f5ecc8'
	};

	res.locals.requestedMailingLists = [];

	if(user.mareEmailList === 'yes') { res.locals.requestedMailingLists.push('news'); }
	if(user.adoptionPartyEmailList === 'yes') { res.locals.requestedMailingLists.push('adoptionParties'); }
	if(user.fundraisingEventsEmailList === 'yes') { res.locals.requestedMailingLists.push('fundraising'); }

	async.each(res.locals.requestedMailingLists, function(listName, callback) {
		keystone.list('Mailing List').model.findById(res.locals.mailingLists[listName])
				.exec()
				.then(function(result) {

					if(res.locals.registrationType === 'socialWorker') {
						result.socialWorkerAttendees.push(res.locals.newUserID);
					} else if (res.locals.registrationType === 'prospectiveParent') {
						result.familyAttendees.push(res.locals.newUserID);
					}

					result.save(function(err) {
						console.log('user saved to ' + listName + ' list');
						callback();
					}, function(err) {
						console.log(err);
						callback();
					});

				}, function(err) {
					console.log(err);
					callback();
				});

	}, function(err){
	    // if any of the file processing produced an error, err would equal that error
	    if( err ) {
	      // One of the iterations produced an error.
	      // All processing will now stop.
	      console.log('an error occurred saving the user to one or more mailing lists');
	      done();
	    } else {
	      console.log('user saved to all email lists successfully');
	      done();
	    }
	});
};