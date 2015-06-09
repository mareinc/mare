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

  // Load models needed to build out menus
  var Menu = keystone.list('Menu');
  var Page = keystone.list('Page');

  // Create arrays for each menu
  var siteNav = locals.siteNav = [];
  var mainNav = locals.mainNav = [];

  // Load menu data via deferreds to ensure they are fully populated before moving on
  Q.all([
    populateMenu(siteNav, 'site menu'),
    populateMenu(mainNav, 'main menu')
  ]).then(function() {
    next();
  }).done();

  // Debt: Try the populate ability using .populate() in the page query
  // Debt: Think about making menu loading more modular, and storing that middleware in the /lib directory (See comment at top of page)
  function populateMenu(list, title) {
    // var deferred = Q.defer();

    // // Find the menu in order to extract it's ID
    // Menu.model.findOne()
    //     .where('title', title)
    //     .exec()
    //     .then(function(menu) {

    //       // Use the menu ID to find all page references it contains
    //       Page.model.find()
    //           .where('menu', menu.id)
    //           .exec()
    //           .then(function (pages) {
    //             // Debt: Clean up promise usage, binding of locals.siteNav and locals.mainNav is ugly
    //             if(list === locals.siteNav) {
    //               locals.siteNav = buildMenuElement(pages);
    //             } else if(list === locals.mainNav) {
    //               locals.mainNav = buildMenuElement(pages);
    //             }

    //             deferred.resolve();
    //           });
    //     });

    //     return deferred.promise;
  
    // function buildMenuElement(pages, target) {
      
    //   var menuArr = [];

    //   // Debt: Use better Underscore method for filtering pages
    //   _.each(pages, function(page) {

    //     // == instead of === because subMenu is an Object and target is a String
    //     if(page.get('subMenu') == target) {
    //                 menuArr.push({
    //                   url: page.url,
    //                   title: page.title,
    //                   children: buildMenuElement(pages, page.id)
    //                 });
    //               }
    //             });

    //   return menuArr;
    // }
  };
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