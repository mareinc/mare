var keystone 		= require('keystone'),
	async 			= require('async'),
	_ 				= require('underscore'),
	User			= keystone.list('User'),
	SiteVisitor 	= keystone.list('Site Visitor'),
	SocialWorker 	= keystone.list('Social Worker'),
	Family			= keystone.list('Family'),
	MailingList		= keystone.list('Mailing List');

exports.registerUser = function(req, res, next) {

	var user = req.body,
		files;

	// Initialize validation checks to failing values to ensure they actually pass all checks
	res.locals.isEmailInvalid		= true,
	res.locals.isEmailDuplicate		= true,
	res.locals.isPasswordInvalid	= true;
	// Capture the registration type which determines which path we take during registration
	res.locals.registrationType = user.registrationType;
	// Set the user type and redirect URL for use throughout the registration process
	switch(res.locals.registrationType) {
		case 'siteVisitor':
			res.locals.userModel = SiteVisitor;
			res.locals.redirectPath = '/register#site-visitor';
			break;
		case 'socialWorker':
			res.locals.userModel = SocialWorker;
			res.locals.redirectPath = '/register#social-worker';
			break;
		case 'family':
			res.locals.userModel = Family;
			res.locals.redirectPath = '/register#family';
	}
	// TODO: Remove this line, it's just for debugging
	console.log('registration type: ' + res.locals.registrationType);

	async.parallel([
		function(done) { exports.validateEmail(user.email, res, done); },
		function(done) { exports.checkForDuplicateEmail(user.email, res, done); },
		function(done) { exports.validatePassword(user.password, user.confirmPassword, res, done); }
	], function() {
		if(res.locals.isEmailInvalid) { res.locals.messages.push({ type: 'error', message: 'email is invalid' }); }
		if(res.locals.isEmailDuplicate) { res.locals.messages.push({ type: 'error', message: 'email already exists in the system' }); }
		if(res.locals.isPasswordInvalid) { res.locals.messages.push({ type: 'error', message: 'passwords don\'t match' }); }

		console.log(res.locals.messages);
		// TODO: Add check for required fields
		if(res.locals.messages.length > 0) {
			// TODO: send the error messages as flash messages
			res.redirect(303, res.locals.redirectPath);
		} else {
			if(res.locals.registrationType === 'siteVisitor') {

				async.series([
					function(done) { exports.saveSiteVisitor(user, res, done); }
				], function() {
					res.redirect(303, res.locals.redirectPath);
					 // TODO: Post a success or error flash message
				});

			} else if (res.locals.registrationType === 'socialWorker') {

				async.series([
					function(done) { exports.saveSocialWorker(user, res, done); },
					function(done) { exports.getUserID(user, res.locals.userModel, res, done); },
					function(done) { exports.addToMailingLists(user, res, done); }
				], function() {
					res.redirect(303, res.locals.redirectPath);
					 // TODO: Post a success or error flash message
				});

			} else if (res.locals.registrationType === 'family') {
				// Store any uploaded files
			    res.locals.files = req.files;

				async.series([
					function(done) { exports.saveFamily(user, res, done); },
					function(done) { exports.getUserID(user, res.locals.userModel, res, done); },
					function(done) { exports.uploadFile(res.locals.userModel, 'homestudy', 'homestudyFile_upload', res.locals.files.homestudyFile_upload, res, done); },
					function(done) { exports.addToMailingLists(user, res, done); }
				], function() {
					res.redirect(303, res.locals.redirectPath);
					 // TODO: Post a success or error flash message
				});
			}
		}
	});

};

exports.saveSiteVisitor = function saveSiteVisitor(user, res, done) {

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

	newUser.save(function(err) {
		// TODO: if the user requested an email of the info packet, send it
		// TODO: if the user requested a mail copy of the info packet, add it to an object containing email information before sending it to Diane
		//       so we can capture all relevant information in one email
		res.locals.messages.push({ type: 'success', message: 'Congratulations, your account has been successfully created' });
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

exports.saveFamily = function saveFamily(user, res, done) {

	var newUser = new Family.model({

		isActive							: true,
		email								: user.email,
		password							: user.password,
		registrationNumber					: exports.getNextRegistrationNumber(),

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

		stages 								: exports.getStages(user),

		homestudy: {
			completed						: user.processProgression.indexOf('homestudyCompleted') !== -1 ? true : false,
			initialDate						: user.processProgression.indexOf('homestudyCompleted') !== -1 ? user.homestudyDateComplete : undefined
		},

		numberOfChildren					: user.childrenInHome,

		otherAdultsInHome: {
			number							: parseInt(user.otherAdultsInHome, 10)
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

			numberOfChildrenToAdopt			: parseInt(user.numberOfChildrenPrefered, 10),
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

	exports.setChildren(user, newUser, res);
	console.log(newUser);

	// ANNA: Uncomment this section when you're ready for users to save for real.

	// newUser.save(function(err) {
	// 	// TODO: if the user requested an email of the info packet, send it
	// 	// TODO: if the user requested a mail copy of the info packet, add it to an object containing email information before sending it to Diane
	// 	//       so we can capture all relevant information in one email
	// 	console.log('new family saved');
	// 	res.locals.messages.push({ type: 'success', message: 'your account has been successfully created' });
	// 	done();
	// }, function(err) {
	// 	console.log(err);
	// 	res.locals.messages.push({ type: 'error', message: 'there was an error creating your account' });
	// 	done();
	// });

	// ANNA: end section to uncomment

	// TODO: on success, send email with social worker information
	// socialWorkerName: 'Jane Smith',
	// socialWorkerAgency: 'jane smith\'s agency',
	// socialWorkerPhone: '2222222222',
	// socialWorkerEmail: 'asdfij@asdf.com'

}

/* New user data validation functions */
// Return true if the submitted email is valid
exports.validateEmail = function validateEmail(email, res, done) {

	var emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/; // A string to validate that an email is valid
	res.locals.isEmailInvalid = !emailPattern.test(email); // We want to know if the email is invalid, so we need to take the inverse of the test result

	done();

};
// Return true if the submitted email already exists in the system for a user of any type
exports.checkForDuplicateEmail = function checkForDuplicateEmail(email, res, done) {
	// All user types inherit from the User model, so checking User will allow us to accurately check for duplicates
	User.model.findOne()
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

exports.getUserID = function getUserID(user, userModel, res, done) {
	var email = user.email;

	userModel.model.findOne({ email: email }).exec(function (err, user) {
		res.locals.newUserID = user._id;
		done();
	});

};

exports.addToMailingLists = function addToMailingLists(user, res, done) {
	res.locals.mailingLists = {
		news			: '5692fcc6eb0d8a13f5f5ecc7',
		adoptionParties	: '569806f50151ac0300616ca0',
		fundraising		: '5692fcc6eb0d8a13f5f5ecc8'
	};

	res.locals.requestedMailingLists = [];

	if(user.mareEmailList === 'yes') { res.locals.requestedMailingLists.push('news'); }
	if(user.adoptionPartyEmailList === 'yes') { res.locals.requestedMailingLists.push('adoptionParties'); }
	if(user.fundraisingEventsEmailList === 'yes') { res.locals.requestedMailingLists.push('fundraising'); }
	// Loop through each of the mailing lists the user should be added to and add them.  Async allows all assignments
	// to happen in parallel before handling the result.
	async.each(res.locals.requestedMailingLists, function(listName, callback) {
		MailingList.model.findById(res.locals.mailingLists[listName])
				.exec()
				.then(function(result) {

					if(res.locals.registrationType === 'socialWorker') {
						result.socialWorkerAttendees.push(res.locals.newUserID);
					} else if (res.locals.registrationType === 'family') {
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

exports.uploadFile = function uploadFile(userModel, targetFieldPrefix, targetField, file, res, done) {

	// TODO: however this will be done, we need to check to see if the file object is stored, if not, we can ignore this whole function
	userModel.model.findById(res.locals.newUserID)
				.exec()
				.then(function(user) {
					console.log('file');
					console.log(file);

					user[targetFieldPrefix][targetField] = file;

					user.save(function(err) {
						console.log('file saved for the user');
						done();
					}, function(err) {
						console.log(err);
						done();
					});

				}, function(err) {
					console.log('error fetching user to save file attachment');
					console.log(err);
					done();
				});
};

exports.getNextRegistrationNumber = function getNextRegistrationNumber() {
	return '12345';
};

exports.getCurrentDate = function getCurrentDate() {

	var date = new Date();

	var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
	return formattedDate;

};

exports.setChildren = function setChildren(user, familyObject, res) {
	// console.log anything you need to check and it will show up in your console output where you ran nodemon keystone
	console.log('adding children to family object');

	// ANNA: comments to help you below

	// the 'user' parameter is all the information submitted on the form
	// the 'familyObject' is the current model we're creating before it's been saved
	// res is the standard node response object

	// NOTE: In order for values to get passed in with the form, each input needs to have a name attribute.  Whatever is stored in name
	//		 is what you'll use to access that entry in the submitted data object.  Example, if you put name="child1Name" for the name field
	//		 of the first child, you can access that value using user.child1Name.  You'll need to find a way to add names to each child entry input
	//		 so you can loop through each to set up the children sections in the model.  One way you can dynamically add these name values is to store
	//		 the base value in a data attribute, for example, in the form section you're replicating to get all the child sections, instead of name="dateOfBirth"
	//		 or name="type", use data-name="dateOfBirth" or data-name="type".  Then in your JavaScript code that replicates those sections, you can access
	//		 the data value using jQuery with $.data('name') to get the value 'dateOfBirth' or 'type'.  From there you can set the actual name of the field by
	//		 appending child1, child2, child3 etc. in front of it.

	// ANOTHER NOTE: I'm currently not generating the registration number on the fly the way I should be (I'll code that after you finish your stuff), so
	//				 you should only be able to save a single entry before it complains that you're trying to create a user with a duplicate registrationNumber where
	//				 dups arent allowed.  To get around this, stay logged in as an administrator (username: admin@keystonejs.com, password: admin), when it takes you
	//				 to the preferences page, click on the link to take you to the admin panel (I keep this open in a new tab for fast access), navigate to Families under
	//				 People, and refresh to see your newly created family.  Just delete it after you create it to allow you to create another.

	// 1. check the number of children the user specified
	var numberOfChildren = user.childrenInHome;
	console.log(numberOfChildren + ' children in the home');
	// 2. loop numberOfChildren times (you can skip setting var numberOfChildren = user.childrenInHome and just loop against user.childrenInHome, I just did that to illustrate the steps).
	for(var i = 0; i <= numberOfChildren; i++) {
		// familyObject['child' + i + 'Name'] = user['child' + i]['name']; // Not sure if this will work, I took a stab at what I thought the syntax would be
		// familyObject['child' + i + 'DateOfBith'] = user['child' + i]['birthDate'];
		// familyObject['child' + i + 'Gender'] = user['child' + i]['gender'];
		// familyObject['child' + i + 'Type'] = user['child' + i]['type'];
	}

};

exports.getStages = function getStages(family) {

	stages = {
		MAPPTrainingCompleted: {},
		workingWithAgency: {},
		lookingForAgency: {},
		gatheringInformation: {}
	};

	if(family.processProgression.indexOf('MAPPTrainingCompleted') !== -1) {

		stages.MAPPTrainingCompleted.completed = true;
		stages.MAPPTrainingCompleted.date = exports.getCurrentDate();

	} else if(family.processProgression.indexOf('workingWithAgency') !== -1) {

		stages.workingWithAgency.started = true;
		stages.workingWithAgency.date = exports.getCurrentDate();

	} else if(family.processProgression.indexOf('lookingForAgency') !== -1) {

		stages.lookingForAgency.started = true;
		stages.lookingForAgency.date = exports.getCurrentDate();

	} else if(family.processProgression.indexOf('gatheringInformation') !== -1) {

		stages.gatheringInformation.started = true;
		stages.gatheringInformation.date = exports.getCurrentDate();

	}

	return stages;

};