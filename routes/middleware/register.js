var keystone 		= require('keystone'),
	async 			= require('async'),
	_ 				= require('underscore'),
	SiteUser 		= keystone.list('Site User'),
	SocialWorker 	= keystone.list('Social Worker');
	MailingList		= keystone.list('Mailing List');

exports.registerUser = function(req, res, next) {
	console.log('in register user');
	var self							= this,
		user               				= req.body,
		registrationType   				= user.registrationType,
		newUser;

	res.locals.isEmailInvalid			= true,
	res.locals.isEmailDuplicate			= true,
	res.locals.isPasswordInvalid		= true;

	console.log('registration type: ' + registrationType);

	if(registrationType === 'siteVisitor') {
		async.parallel([
			function(done) { exports.validateEmail(user.email, res, done); },
			function(done) { exports.checkForDuplicateEmail(user.email, SiteUser, res, done); },
			function(done) { exports.validatePassword(user.password, user.confirmPassword, res, done); }
			// function(done) { exports.checkRequiredFields([user.firstName, user.lastName, user.email, user.password, user.confirmPassword]); }
		], function() {
			if(res.locals.isEmailInvalid) { res.locals.messages.push({ type: 'error', message: 'email is invalid' }); }
			if(res.locals.isEmailDuplicate) { res.locals.messages.push({ type: 'error', message: 'email already exists in the system' }); }
			if(res.locals.isPasswordInvalid) { res.locals.messages.push({ type: 'error', message: 'passwords don\'t match' }); }

			console.log(res.locals.messages);
			// TODO: Add check for required fields
			if(res.locals.messages.length > 0) {
				// TODO: send the error messages as flash messages
			} else {
				console.log('creating new site user, checks have passed');

				console.log(user);

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

				console.log('about to save...');
				console.log(newUser);
				newUser.save(function(err) {

					res.locals.messages.push({ type: 'success', message: 'your user account was successfully created' });
					console.log('site visitor has been saved');

					//next();
					res.redirect('/register#site-visitor');
					/* TODO: Post a success or error flash message */
				}, function(err) {

					res.locals.messages.push({ type: 'error', message: 'there was a problem saving your information, please try again.  If this problem persists, please contact MARE.' });
					console.log(err);
					next();

				});
			}
		});
	} else if (registrationType === 'socialWorker') {
		async.parallel([
			function(done) { exports.validateEmail(user.email, res, done); },
			function(done) { exports.checkForDuplicateEmail(user.email, SocialWorker, res, done); },
			function(done) { exports.validatePassword(user.password, user.confirmPassword, res, done); }
			// function(done) { exports.checkRequiredFields([user.firstName, user.lastName, user.email, user.password, user.confirmPassword]); }
		], function() {
			if(res.locals.isEmailInvalid) { res.locals.messages.push({ type: 'error', message: 'email is invalid' }); }
			if(res.locals.isEmailDuplicate) { res.locals.messages.push({ type: 'error', message: 'email already exists in the system' }); }
			if(res.locals.isPasswordInvalid) { res.locals.messages.push({ type: 'error', message: 'passwords don\'t match' }); }

			console.log(res.locals.messages);
			// TODO: Add check for required fields
			if(res.locals.messages.length > 0) {
				// TODO: return an error message to the user and return
				res.redirect('/register#social-worker');
			} else {
				console.log('creating new social worker, checks have passed');

				console.log(user);

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
						preferred 		: user.socialWorkerPreferredPhone
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

				console.log('about to save...');
				console.log(newUser);
				newUser.save(function(err) {

					res.locals.messages.push({ type: 'success', message: 'your social worker account has been successfully created' });
					console.log('social worker has been saved');
					console.log('the email: ' + user.email);
					var email = user.email;

					var userID;

					SocialWorker.model.findOne({ email }).exec(function (err, user) {
						console.log(user);
						console.log(user._id);
					});

					//next();
					res.redirect('/register#social-worker');
					 // TODO: Post a success or error flash message
				}, function(err) {

					res.locals.messages.push({ type: 'error', message: 'there was a problem saving your information, please try again.  If this problem persists, please contact MARE.' });
					console.log(err);
					next();

				});
			}
		});
	} else if (registrationType === 'prospectiveParent') {
		console.log('TODO: make a new prospective parent');
	}

	/* TODO: Place next() in the appropriate place */
};

/* New user data validation functions */
// Return true if the submitted email is valid
exports.validateEmail = function(email, res, done) {

	var emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/; // A string to validate that an email is valid
	res.locals.isEmailInvalid = !emailPattern.test(email); // We want to know if the email is invalid, so we need to take the inverse of the test result

	done();

};
// Return true if the submitted email already exists in the system
// TODO: This doesn't return in time for the above check and users with duplicate emails are allowed to be created.
exports.checkForDuplicateEmail = function(email, userType, res, done) {

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
exports.validatePassword = function(password, confirmPassword, res, done) {
	console.log('validating password');
	console.log(password + '   ' + confirmPassword);
	res.locals.isPasswordInvalid = password !== confirmPassword;
	done();

};

// TODO: Verify this function works as expected
// exports.checkRequiredFields = function(fieldArray, done) {
// 	var allFieldsRequired = true;
// 	// Loop through the array and make sure there's a value for each
// 	_.each(fieldArray, function(element) {

// 		if( !element || element.trim().length === 0 ) {
// 			allFieldsRequired = false;
// 		}
// 	});

// 	return allFieldsRequired;
// };