/**
 * This file contains the common middleware used by your routes.
 * 
 * Extend or replace these functions as your application requires.
 * 
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */

var _ = require('underscore');


/**
	Initialises the standard view locals
	
	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/

exports.initLocals = function(req, res, next) {
	
	var locals = res.locals;
	
	// Create the different navigation groupings
	locals.siteNav = [
		{ label: 'About Us',		key: 'about',			href: '/about'},
		{ label: 'Our Services',	key: 'services',		href: '/services'},
		{ label: 'Success Stories',	key: 'successStories',	href: '/success-stories'},
		{ label: 'Upcoming Events',	key: 'upcomingEvents',	href: '/upcoming-events'}
	]

	locals.mainNav = [
		{ label: 'Considering Adoption',	key: 'consideringAdoption',		href: '/considering-adoption'},
		{ label: 'Meet the Children',		key: 'meetTheChildren',			href: '/meet-the-children'},
		{ label: 'Family Support Services',	key: 'familySupportServices',	href: '/family-support-services'},
		{ label: 'For Social Workers',		key: 'forSocialWorkers',		href: '/for-social-workers'},
		{ label: 'Ways to Help',			key: 'waysToHelp',				href: '/ways-to-help'}
	]

	locals.navLinks = [
		{ label: 'Home',		key: 'home',		href: '/' }
	];
	
	locals.user = req.user;
	
	next();
	
};


/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function(req, res, next) {
	
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
	
	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/keystone/signin');
	} else {
		next();
	}
	
};
