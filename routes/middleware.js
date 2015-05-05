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

/**
  Initialises the standard view locals
  
  The included layout depends on the navLinks array to generate
  the navigation in the header, you may wish to change this array
  or replace it with your own templates / logic.
*/

exports.initLocals = function(req, res, next) {
  'use strict';
  
  var locals = res.locals;

  // Load menu models
  var Menu = keystone.list('Menu');
  var Page = keystone.list('Page');
  
  // Create the navigation groups

  // Create arrays to hold our menu objects
  locals.siteNav = [];
  locals.mainNav = [];

  // Note: Might want to bind these to a data- attribute to prevent the need to explicitly call the menu(s) by name
  populateMenu(locals.siteNav, 'site menu');
  //populateMenu(locals.mainNav, 'main menu');

  locals.navLinks = [
    { label: 'Home', key: 'home', href: '/' }
  ];
  
  locals.user = req.user;
  
  next();

  /* 
      TODO: PULL INIT OF ADMIN VS NON-ADMIN INTO DIFFERENT MIDDLEWARE 
  */
  function populateMenu(list, target) {

    Menu.model.find()
        .where('title', target)
        .exec(function(err, targetMenu) {
          var primaryNavItemIDs = targetMenu[0].get('pages');
          // Called in this way for now to make sure we have the primary nav items before
          // moving onto the next step.
          attachMainMenuItems(list, primaryNavItemIDs);


    });

    function attachMainMenuItems(list, primaryNavItemIDs) {
      // Loop through all top level list elements
      // Recursively check for elements with each target element as a parent
      Page.model.find()
          .where('_id')
          .in(primaryNavItemIDs)
          .exec(function(err, menuItems) {
            _.each(menuItems, function(menuItem) {
              list.push({
                key: menuItem.key,
                url: menuItem.url,
                title: menuItem.title
              })
            });
          });
      }
    }

    function attachSubMenuItems() {

    }
  // This feels like an inefficient way to build the menu, perhaps it can be done with a better DB query
  // function attachSubMenus(target, menu) {
  //   Menu.model.find()
  //       .where('location', target)
  //       .where('parent', menu._id)
  //       .exec(function(err, menus) {
  //         menu.children = [];

  //         _.each(menus, function(menuItem) {
  //           // Recursively attach all child menu items
  //           attachSubMenus(target, menuItem);

  //           menu.children.push(menuItem);
  //         });
  //         console.log(menu);         
  //       });
  // }
  
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
