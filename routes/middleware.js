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
	'use strict';
	
	var locals = res.locals;
	
	// Create the navigation groups

	// This object is not currently in use, but may end up being the base for the top-nav menu being
	// defined in this file, or being served from the database, in which case this could help provide
	// a basic structure
	locals.topNav = [
		{ label: 'Home',	type: 'top-nav-item' },
		{ label: 'Language', type: 'top-nav-item', children: [
			{ label: 'En', type: 'sub-nav-item', classification: 'language-option' },
			{ label: 'Sp', type: 'sub-nav-item', classification: 'language-option' }]},
		{ label: 'Log in', type: 'top-nav-item', target: '/keystone/signin', icon: 'down-arrow' },
		{ label: 'Donate', type: 'top-nav-item', classification: 'donate'}
	];

	locals.siteNav = [
		{ label: 'About Us',		key: 'about',			href: '/about' },
		{ label: 'Our Services',	key: 'services',		href: '/services' },
		{ label: 'Success Stories',	key: 'successStories',	href: '/success-stories' },
		{ label: 'Upcoming Events',	key: 'upcomingEvents',	href: '/upcoming-events' }
	];

	locals.mainNav = [
		{ label: 'Considering Adoption',	key: 'consideringAdoption',		href: '/considering-adoption',
			children: [
				{ label: 'Types of Adoption',						key: 'typesOfAdoption',				href: '/types-of-adoption' },
				{ label: 'Can I adopt a Child from Foster Care?',	key: 'adoptFromFosterCare',			href: '/adopt-from-foster-care' },
				{ label: 'Steps in the Process',					key: 'stepsInTheProcess',			href: '/steps-in-the-process' },
				{ label: 'How Can MARE Help?',						key: 'howCanMAREHelp',				href: '/how-can-MARE-help' }
			]},
		{ label: 'Meet the Children',		key: 'meetTheChildren',			href: '/meet-the-children',
			children: [
				{ label: 'Who are the Children?',					key: 'whoAreTheChildren',			href: '/who-are-the-children'},
				{ label: 'Waiting Child Profiles',					key: 'waitingChildProfiles',		href: '/waiting-child-profiles' },
				{ label: 'Ways to Meet Waiting Children',			key: 'waysToMeetWaitingChildren',	href: '/ways-to-meet-waiting-children' },
				{ label: 'For Homestudied Familes',					key: 'forHomestudiedFamilies',		href: '/for-homestudied-familes' }
			]},
		{ label: 'Family Support Services',	key: 'familySupportServices',	href: '/family-support-services',
			children: [
				{ label: 'How Does MARE Support Families',			key: 'howDoesMARESupportFamilies',	href: '/how-does-MARE-support-families' },
				{ label: 'Friend of the Family Mentor Program',		key: 'friendsOfMentorProgram',		href: '/friends-of-the-family-mentor-program' },
				{ label: 'Other Family Support Services',			key: 'OtherFamilySupportServices',	href: '/other-family-support-services' }
			]},
		{ label: 'For Social Workers',		key: 'forSocialWorkers',		href: '/for-social-workers',
			children: [
				{ label: 'Register a Child',						key: 'registerAChild',				href: '/register-a-child' },
				{ label: 'Recruitment Opportunities',				key: 'recruitmentOpportunities',	href: '/recruitment-opportunities' },
				{ label: 'Attend Events',							key: 'attendEvents',				href: '/attend-events' },
				{ label: 'Register a Family',						key: 'registerAFamily',				href: '/register-a-family' },
				{ label: 'Use Online Matching',						key: 'useOnlineMatching',			href: '/use-online-matching' }
			]},
		{ label: 'Ways to Help',			key: 'waysToHelp',				href: '/ways-to-help',
			children: [
				{ label: 'For Individuals',							key: 'forIndividuals',				href: '/for-individuals' },
				{ label: 'For Business',							key: 'forBusiness',					href: '/for-business' },
				{ label: 'Experienced Families Walk for Adoption &amp; Other Events', key: 'walkForAdoptionAndOtherEvents',	href: '/walk-for-adoption-and-other-events' },
				{ label: 'Donate Your Care',						key: 'donateYourCar',				href: '/donate-your-car' },
				{ label: 'Creative Ways to Support MARE',			key: 'waysToSupportMARE',			href: '/ways-to-support-MARE',
					children: [
						{label: 'Host a workplace Lunch &amp; Learn',	key: 'hostWorkplaceLunchAndLearn',	href: '/host-a-workplace-lunch-and-learn' },
						{label: 'Another Creative Way to Help',			key: 'anotherCreativeWayToHelp',	href: '/another-creative-way-to-help' },
						{label: 'Yet a Third Way to Help',				key: 'yetAThirdWayToHelp',			href: '/yet-a-third-way-to-help' },
						{label: 'And Even a Fourth Way',				key: 'andEvenAFourthWay',			href: '/and-even-a-fourth-way' }
					]}
			]}
	];

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
