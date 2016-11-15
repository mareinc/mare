/* TODO: move all this middleware into the appropriate files inside the middleware/ directory

/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */

var _ 				= require('underscore'),
	// Load in Keystone for model references
	keystone 		= require('keystone'),
	User 			= keystone.list('User'),
	Child 			= keystone.list('Child'),
	Gender 			= keystone.list('Gender');

/**
	Initialises the standard view locals

	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/

exports.initLocals = function(req, res, next) {
	'use strict';

	var locals = res.locals;
	// a messages object used to display errors, warnings, or informational messages to the user after they've taken an action on the site
	locals.messages = [];

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
			{ title: 'Other Ways to Meet Waiting Children', href: '/page/other-ways-to-meet-waiting-children' }
		]},
		{ title: 'Family Support Services', subMenu: [
			{ title: 'How Does MARE Support Families', href: '/page/how-does-mare-support-families' },
			{ title: 'Friend of the Family Mentor Program', href: '/page/friend-of-the-family-mentor-program' },
			{ title: 'Other Family Support Services', href: '/page/other-family-support-services' }
		]},
		{ title: 'For Social Workers', subMenu: [
			{ title: 'How MARE Can Help You', href: '/page/how-mare-can-help-you' },
			{ title: 'Register a Child', href: '/page/register-a-child' },
			{ title: 'Attend Events', href: '/page/attend-events' },
			{ title: 'Register a Family', href: '/page/register-a-family' },
			{ title: 'Search for Children & Families', href: '/page/search-for-children-and-families' }
		]},
		{ title: 'Events', subMenu: [
			{ title: 'MARE Adoption Parties & Information Events', href: '/events/adoption-parties/'},
			{ title: 'MAPP Training', href: '/events/mapp-trainings/' },
			{ title: 'Agency Information Meetings', href: '/events/agency-info-meetings/' },
			{ title: 'Other Opportunities & Trainings', href: '/events/other-trainings/' },
			{ title: 'Fundraising Events', href: '/events/fundraising-events/' }
		]},
		{ title: 'Ways to Help', subMenu: [
			{ title: 'Why give?', href: '/page/why-give' },
			{ title: 'How you can help', href: '/page/how-you-can-help' },
			{ title: 'How businesses and organizations can help', href: '/page/how-businesses-and-organizations-can-help' },
			{ title: 'Experienced families', href: '/page/experienced-families' }
		]},
		{ title: 'About Us', lastMenu: true, subMenu: [
			{ title: 'Mission & Vision', href: '/page/mission-and-vision' },
			{ title: 'History', href: '/page/history' },
			{ title: 'Meet the Staff', href: '/page/meet-the-staff' },
			{ title: 'Board of Directors', href: '/page/board-of-directors' },
			{ title: 'MARE in the News', href: '/page/mare-in-the-news' },
			{ title: 'Adoption Party Family Registration Form', href: '/form/adoption-party-family-registration-form' },
			{ title: 'Adoption Party Social Worker Registration Form', href: '/form/adoption-party-social-worker-registration-form' },
			{ title: 'Agency Event Submission Form', href: '/form/agency-event-submission-form' },
			{ title: 'Car Donation Form', href: '/form/car-donation-form' },
			{ title: 'Child Registration Form', href: '/form/child-registration-form' },
			{ title: 'Information Request Form', href: '/form/information-request-form' }
		]}];

	locals.pageSectionMapping = {
		'/page/types-of-adoption' : 'Considering Adoption',
		'/page/can-i-adopt-a-child-from-foster-care' : 'Considering Adoption',
		'/page/steps-in-the-process' : 'Considering Adoption',
		'/page/how-can-mare-help' : 'Considering Adoption',

		'/page/who-are-the-children' : 'Meet the Children',
		'/waiting-child-profiles' : 'Meet the Children',
		'/page/other-ways-to-meet-waiting-children' : 'Meet the Children',
		'/page/for-homestudied-families' : 'Meet the Children',

		'/page/how-does-mare-support-families' : 'Family Support Services',
		'/page/friend-of-the-family-mentor-program' : 'Family Support Services',
		'/page/other-family-support-services' : 'Family Support Services',

		'/page/how-mare-can-help-you' : 'For Social Workers',
		'/page/register-a-child' : 'For Social Workers',
		'/page/attend-events' : 'For Social Workers',
		'/page/register-a-family' : 'For Social Workers',
		'/page/search-for-children-and-families' : 'For Social Workers',

		'/page/why-give' : 'Ways to Help',
		'/page/how-you-can-help' : 'Ways to Help',
		'/page/how-businesses-and-organizations-can-help' : 'Ways to Help',
		'/page/experienced-families' : 'Ways to Help',

		'/page/mission-and-vision' : 'About Us',
		'/page/history' : 'About Us',
		'/page/meet-the-staff' : 'About Us',
		'/page/board-of-directors' : 'About Us',
		'/page/mare-in-the-news' : 'About Us'
	};

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
		return next();
	}

};

exports.requireMigrationUser = function(req, res, next) {
	'use strict';

	if (!req.user || !req.user.canMigrateData) {
		res.redirect('/');
	} else {
		return next();
	}

};

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

/* TODO: This should be placed in a date-time.js file, but I wasn't able to get it to register on my first try */
exports.getAge = function getAge(dateOfBirth) {

	var today = new Date();
	var birthDate = new Date(dateOfBirth);
	var age = today.getFullYear() - birthDate.getFullYear();
	var month = today.getMonth() - birthDate.getMonth();

	if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}

	return age;
};

/* Date objects are easily compared for sorting purposes when converted to milliseconds */
exports.convertDate = function convertDate(date) {
	return new Date(date).getTime();
};

/* Converts an array to a string like 'element1, element2, and element3' */
exports.getArrayAsList = function getArrayAsList( array ) {
	// store the length of the array to determine the separator word
	const arrayLength = array.length;
	// creates a variable for the delimeter value
	let delimeter = arrayLength > 2 ? ', and ' : ' and ';
	// convert the array to a string separated by commas
	let returnString = array.join(',');
	// findn the index of the last comma
	const lastComma = returnString.lastIndexOf(',');
	// replace the last comma
	if(lastComma !== -1 ) {
		returnString = returnString.substring( 0, lastComma ) + delimeter + returnString.substring( lastComma + 1 );
	}
	// add space after all remaining commas
	returnString = returnString.replace(',', ', ');

	return returnString;
}

exports.charge = function(req, res) {
	// var stripeToken = req.body.stripeToken;
    // var amount = 1000;
	//
    // stripe.charges.create({
    //     card: stripeToken,
    //     currency: 'usd',
    //     amount: amount
    // }, function(err, charge) {
    //     if (err) {
    //         res.send(500, err);
    //     } else {
    //         res.send(204);
    //     }
    // });
};
