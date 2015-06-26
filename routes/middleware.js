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

// Load in Keystone for model references
var keystone = require('keystone');

// Load Q for promises
var Q = require('q');

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

  // Create the site menu navigation elements
  var siteNav = locals.siteNav = [
    { title: 'About us', href: '/about-us' },
    { title: 'Our Services', href: '/our-services' },
    { title: 'Success Stories', href: '/success-stories' },
    { title: 'Upcoming Events', href: '/upcoming-events' }
  ];

  // Create the main menu navigation.
  var mainNav = locals.mainNav = [
    { title: 'Considering Adoption?', subMenu: [
      { title: 'Types of Adoption', href: '/types-of-adoption' },
      { title: 'Can I adopt a Child from Foster Care?', href: '/can-i-adopt-a-child-from-foster-care' },
      { title: 'Steps in the Process', href: '/steps-in-the-process' },
      { title: 'How Can MARE Help?', href: '/how-can-mare-help' }
    ]},
    { title: 'Meet the Children', subMenu: [
      { title: 'Who are the Children?', href: '/who-are-the-children' },
      { title: 'Waiting Child Profiles', href: '/waiting-child-profiles' },
      { title: 'Ways to Meet Waiting Children', href: '/ways-to-meet-waiting-children' },
      { title: 'For Homestudied Families', href: '/for-homestudied-families' }
    ]},
    { title: 'Family Support Services', subMenu: [
      { title: 'How Does MARE Support Families', href: '/how-does-mare-support-families' },
      { title: 'Friend of the Family Mentor Program', href: '/friend-of-the-family-mentor-program' },
      { title: 'Other Family Support Services', href: '/other-family-support-services' }
    ]},
    { title: 'For Social Workers', subMenu: [
      { title: 'Register a Child', href: '/register-a-child' },
      { title: 'Recruitment Opportunities', href: '/recruitment-opportunities' },
      { title: 'Attend Events', href: '/attend-events' },
      { title: 'Register a Family', href: '/register-a-family' },
      { title: 'Use Online Matching', href: '/use-online-matching' }
    ]},
    { title: 'Ways to Help', subMenu: [
      { title: 'For Individuals', href: '/for-individuals' },
      { title: 'For Businesses', href: '/for-businesses' },
      { title: 'Experienced Families', href: '/experienced-families' },
      { title: 'Walk for Adoption &amp; Other Events', href: '/walk-for-adoption-and-other-events' },
      { title: 'Donate Your Car', href: '/donate-your-car' },
      { title: 'Creative Ways to Support MARE', subMenu: [
        { title: 'Host a Workplace Lunch &amp; Learn', href: '/host-a-workplace-lunch-and-learn' },
        { title: 'Another Creative Way to Help', href: '/another-creative-way-to-help' },
        { title: 'Yet a Third Way to Help', href: '/yet-a-third-way-to-help' },
        { title: 'And Even a Fourth Way', href: '/and-even-a-fourth-way' }
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