/**
 * This file contains the common middleware used by your routes.
 * 
 * Extend or replace these functions as your application requires.
 * 
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */

var _ = require('underscore'),
	stripe = require('stripe')('process.env.STRIPE_TEST_SECRET'),
	// Load in Keystone for model references
	keystone = require('keystone'),
	User = keystone.list('User'),
	SiteUser = keystone.list('Site User'),
	SocialWorker = keystone.list('Social Worker'),
	Child = keystone.list('Child');

/**
	Initialises the standard view locals
	
	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/

exports.initLocals = function(req, res, next) {
	'use strict';

	var locals = res.locals;

	locals.navLinks = [
		{ label: 'Home', key: 'home', href: '/' }
	];

	locals.user = req.user;

	// Create the main menu navigation.
	locals.mainNav = [
		{ title: 'Considering Adoption?', subMenu: [
			{ title: 'Types of Adoption', href: '/page/types-of-adoption' },
			{ title: 'Can I adopt a Child from Foster Care?', href: '/page/can-i-adopt-a-child-from-foster-care' },
			{ title: 'Steps in the Process', href: '/page/steps-in-the-process' },
			{ title: 'How Can MARE Help?', href: '/page/how-can-mare-help' }
		]},
		{ title: 'Meet the Children', subMenu: [
			{ title: 'Who are the Children?', href: '/page/who-are-the-children' },
			{ title: 'Waiting Child Profiles', href: '/waiting-child-profiles' },
			{ title: 'Other Ways to Meet Waiting Children', href: '/page/ways-to-meet-waiting-children' },
			{ title: 'For Homestudied Families', href: '/page/for-homestudied-families' }
		]},
		{ title: 'Family Support Services', subMenu: [
			{ title: 'How Does MARE Support Families', href: '/page/how-does-mare-support-families' },
			{ title: 'Friend of the Family Mentor Program', href: '/page/friend-of-the-family-mentor-program' },
			{ title: 'Other Family Support Services', href: '/page/other-family-support-services' }
		]},
		{ title: 'For Social Workers', subMenu: [
			{ title: 'How MARE Can Help You', href: '/page/how-mare-can-help-you'},
			{ title: 'Register a Child', href: '/page/register-a-child' },
			{ title: 'Attend Events', href: '/page/attend-events' },
			{ title: 'Register a Family', href: '/page/register-a-family' },
			{ title: 'Search for Children & Families', href: '/page/search-for-children-and-families' }
		]},
		{ title: 'Ways to Help', subMenu: [
			{ title: 'Why give?', href: '/page/why-give' },
			{ title: 'How you can help', href: '/page/how-you-can-help' },
			{ title: 'How businesses and organizations can help', href: '/page/how-businesses-and-organizations-can-help' },
			{ title: 'Experienced families', href: '/page/experienced-families' }
		]},
		{ title: 'About Us', subMenu: [
			{ title: 'Mission & Vision', href: '/page/mission-and-vision'},
			{ title: 'History', href: '/page/history'},
			{ title: 'Meet the Staff', href: '/page/meet-the-staff'},
			{ title: 'Board of Directors', href: '/page/board-of-directors'},
			{ title: 'MARE in the News', href: '/page/mare-in-the-news'},
			{ title: 'Annual Report', href: '/page/annual-report'},
			{ title: 'Upcoming Events', subMenu: [
				{ title: 'MARE Adoption Parties & Information Events', href: '/page/mare-adoption-parties-and-information-events' },
				{ title: 'MAPP Training', href: '/page/mapp-training' },
				{ title: 'Agency Information Meetings', href: '/page/agency-information-meetings' },
				{ title: 'Other Opportunities & Trainings', href: '/page/other-opportunities-and-trainings' },
				{ title: 'Fundraising Events', href: '/page/fundraising-events' }
			]}
		]}];

	next();
};

/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function(req, res, next) {
	'use strict';
	
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error')
	};
	
	res.locals.messages = _.any(flashMessages, function(msgs) { return msgs.length; }) ? flashMessages : false;
	
	next();
	
};


/**
	Prevents people from accessing protected pages when they're not signed in
 */

exports.requireUser = function(req, res, next) {
	'use strict';

	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/keystone/signin');
	} else {
		next();
	}
	
};

exports.registerUser = function(req, res, next) {
	var user = req.body,
		registrationType = user['registrationType'];

	if(registrationType === 'siteVisitor' || registrationType === 'socialWorker') {

		// TODO: isEmailDuplicate DOES NOT WORK BASED ON A RACE CONDITION, AND THIS CHECK NEEDS TO BE REDONE
		var isEmailValid = exports.validateEmail(user.email),
			isEmailDuplicate = exports.checkForDuplicateEmail(user.email),
			isPasswordValid = exports.validatePassword(user.password, user.confirmPassword);

		if(!isEmailValid) {
			console.log('email is invalid');
			req.flash('error', 'email is invalid');
			return;
		}

		if(isEmailDuplicate) {
			console.log('email is a duplicate');
			req.flash('error', 'email already exists in the system');
			return;
		}

		if(!isPasswordValid) {
			console.log('passwords don\'t match');
			req.flash('error', 'passwords don\'t match');
			return;
		}

	}

	/* TODO: this could be cleaned up significantly by pulling the user creation out of the if blocks and specifying shared fields once */
	if(registrationType === 'siteVisitor') {

		/* TODO: Test required fields when created all user types */
		var hasRequiredFields = exports.checkRequiredFields([user.firstName, user.lastName, user.email, user.password, user.confirmPassword]);

		if( !hasRequiredFields ) {
			console.log('required fields are missing, I\'ll be more specific about which ones in the future');
			// req.flash('error', 'required fields are missing');
			return;
		}

		var newUser = new SiteUser.model({

			name: {
				first	: user.firstName,
				last	: user.lastName
			},

			password	: user.password,
			email		: user.email,
			
			phone: {
				mobile	: user.mobilePhone,
				home	: user.homePhone
			},

			address: {
				street1	: user.street1,
				street2	: user.street2,
				city	: user.city,
				state	: user.state,
				zipCode	: user.zipCode
			}

		});

	} else if(registrationType === 'socialWorker') {

		var newUser = new SocialWorker.model({

			name: {
				first	: user.firstName,
				last	: user.lastName
			},

			password	: user.password,
			email		: user.email,
			phone		: user.phone,

			address		: {
				street1	: user.street1,
				street2	: user.street2,
				city	: user.city,
				state	: user.state,
				zipCode	: user.zipCode,
			},

			agency		: user.agency,
			title		: user.title
		});

	} else if(registrationType === 'prospectiveParent') {
		// consider a different function for partial data saves
		console.log('making a new prospective parent');
		return;
	}

	/* TODO: Check for all required fields */

	newUser.save(function(err) {
		console.log('user has been saved');
		/* TODO: Post a success or error flash message */
	});

	/* TODO: Place next() in the appropriate place */
};

/* New user data validation functions */
// Return true if the submitted email is valid
exports.validateEmail = function(email) {

	var emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
	return emailPattern.test(email);

};
// Return true if the submitted email already exists in the system
// TODO: This doesn't return in time for the above check and users with duplicate emails are allowed to be created.
exports.checkForDuplicateEmail = function(email) {

	var isEmailDuplicate = false;

	User.model.find()
		.where('email', email)
		.exec(function (err, user) {
			console.log(user);

			if( user ) {
				console.log('setting duplicate to true');
				isEmailDuplicate = true;
			}

			console.log('returning email duplicate value');
			return isEmailDuplicate;

		});

}

// Return true if the submitted 'password' and 'confirm password' match
exports.validatePassword = function(password, confirmPassword) {

	return password == confirmPassword;

};

// TODO: Verify this function works as expected
exports.checkRequiredFields = function(fieldArray) {
	var allFieldsRequired = true;
	// Loop through the array and make sure there's a value for each
	_.each(fieldArray, function(element) {

		if( !element || element.trim().length === 0 ) {
			allFieldsRequired = false;
		}
	});

	return allFieldsRequired;
}

exports.login = function(req, res, next) {
	/* TODO: Need to add a check to see if the user is verified and active (see Lisa for details) */

	if (!req.body.email || !req.body.password) {
		/* TODO: Need a better message for the user, flash messages won't work because page reloads are stupid */
		req.flash('error', 'Please enter your username and password.');
		return next();
	}

	var onSuccess = function() {
		if (req.body.target && !/join|signin/.test(req.body.target)) {
			console.log('[signin] - Set target as [' + req.body.target + '].');
			res.redirect(req.body.target);
		} else {
			res.redirect('/preferences');
		}
	}
	
	var onFail = function() {
		/* TODO: Need a better message for the user, flash messages won't work because page reloads are stupid */
		req.flash('error', 'Your username or password were incorrect, please try again.');
		return next();
	}

	keystone.session.signin({ email: req.body.email, password: req.body.password }, req, res, onSuccess, onFail);
}

exports.logout = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	keystone.session.signout(req, res, function() {
		res.redirect('/');
	});
};

// TODO: include an error message for this and other functions in middleware if applicable
exports.getChildDetails = function(req, res) {

	var childData = req.body,
		registrationNumber = childData['registrationNumber'];

	/* TODO: Fetch only the needed fields instead of grabbing everything */
	Child.model.find()
        .where('registrationNumber', registrationNumber)
        .exec()
        .then(function (child) {

        	var child = child[0];

        	var relevantData = {
        		name: child.firstName,
        		age: exports.getAge(child.birthDate),
        		registrationNumber: child.registrationNumber,
        		profilePart1: child.profilePart1,
        		profilePart2: child.profilePart2,
        		profilePart3: child.profilePart3,
        		detailImage: child.detailImage,
        		hasVideo: child.video.length > 0,
        		video: child.video.replace('watch?v=', 'embed/'),
        		wednesdaysChild: child.wednesdaysChild
        	};

        	res.send(relevantData);
        });
};

exports.charge = function(req, res) {
	var stripeToken = req.body.stripeToken;
    var amount = 1000;

    stripe.charges.create({
        card: stripeToken,
        currency: 'usd',
        amount: amount
    }, function(err, charge) {
        if (err) {
            res.send(500, err);
        } else {
            res.send(204);
        }
    });
};

// TODO: This function is a duplicate of one found in templates/views/helpers/index.js, which is used exclusively 
// 		 for handlebars templates.  Try to consolodate them
exports.getAge = function(dateOfBirth) {
	var today = new Date();
        var birthDate = new Date(dateOfBirth);
        var age = today.getFullYear() - birthDate.getFullYear();
        var month = today.getMonth() - birthDate.getMonth();
        
        if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
}