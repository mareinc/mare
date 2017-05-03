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
	async			= require( 'async' );
	// load in Keystone for model references
	keystone 		= require('keystone'),
	User 			= keystone.list('User'),
	Child 			= keystone.list('Child'),
	Gender 			= keystone.list('Gender'),
	// load in middleware
	UserMiddleware	= require( './service_user' );

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
		// TODO: add custom header background image for each menu item
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
			{ title: 'Register a Family', href: '/page/register-a-family' }
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
			{ title: 'Annual Report', href: '/page/annual-report' },
			{ title: 'Agency Event Submission Form', href: '/forms/agency-event-submission-form' },
			{ title: 'Car Donation Form', href: '/forms/car-donation-form' },
			{ title: 'Child Registration Form', href: '/forms/child-registration-form' },
			{ title: 'Information Request Form', href: '/forms/information-request-form' }
		]}];

	// based on the url from the requested page, fetch the navigation object for the site section
	locals.currentSection = locals.mainNav.find( ( section ) => {
		return section.subMenu.find( ( menuItem ) => {
			return menuItem.href === req.url;
		});
	});
	// mark the navigation section as selected to allow us to display an active marker during templating
	if( locals.currentSection ) {
		locals.currentSection.selected = true;
	}

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
		res.locals.messages.push( { type: 'error', message: 'Please sign in to access this page.' } );
		res.redirect('/');
	} else {
		return next();
	}

};

exports.setLoginTarget = function( req, res, next ) {

	let locals = res.locals;
	// set the target page for a user logging in while on this page
	locals.loginTarget = req.originalUrl;
	next();
};

exports.login = function( req, res, next ) {

	let locals = res.locals;

	if (!req.body.email || !req.body.password) {
		/* TODO: Need a better message for the user, flash messages won't work because page reloads are stupid */
		req.flash( 'error', { title: 'Something went wrong',
							  detail: 'Please enter your username and password.' } );
		return next();
	}

	async.series([
		done => { UserMiddleware.checkUserActiveStatus( req.body.email, locals, done ); }
	], () =>{

		if( locals.userStatus === 'nonexistent' ) {
			req.flash( 'error', { title: 'Something went wrong',
							  detail: 'Your username or password is incorrect, please try again.' } );
			res.redirect( req.body.target );

		} else if( locals.userStatus === 'inactive' ) {
			// TODO: we need to figure out if they were once active, or change the message to handle that case as well
			req.flash( 'error', { title: 'Something went wrong',
							  detail: 'Your account is not active yet, you will receive an email what your account has been reviewed.' } );
			res.redirect( req.body.target );

		} else if( locals.userStatus === 'active' ) {
			// TODO: you can add a target to the signin of the current page and it will always route correctly back to where the user was
			var onSuccess = function() {
				if ( req.body.target && !/join|signin/.test( req.body.target ) ) {
					console.log( `signin target is: ${ req.body.target }` );
					res.redirect( req.body.target );
				} else {
					res.redirect( '/preferences' );
				}
			}

			var onFail = function() {
				/* TODO: Need a better message for the user, flash messages won't work because page reloads are stupid */
				req.flash( { type: 'error', message: 'Your username or password is incorrect, please try again.' } );
				return next();
			}

			keystone.session.signin( { email: req.body.email, password: req.body.password }, req, res, onSuccess, onFail );
		}
	})
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
