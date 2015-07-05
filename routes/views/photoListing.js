var keystone = require('keystone');

// Load Q for promises
var Q = require('q');

// Load model to allow fetching of children data
var Child = keystone.list('Child')

exports = module.exports = function(req, res) {
    'use strict';
  
    var locals = res.locals;
    
    var view    = new keystone.View(req, res),
        locals  = res.locals,
        children = locals.children;

    var childrenFetched = Q.defer();

    // Use the menu ID to find all page references it contains
    Child.model.find()
        .exec()
        .then(function (results) {
            children = results;

            childrenFetched.resolve();
        });

    // Load menu data via deferreds to ensure they are fully populated before moving on
  Q.all([
    childrenFetched
  ]).then(function() {
    // Fetch the page with the matching URL
    // If it exists, pass the object into the rendering
    // If it doesn't exist, forward to a 404 page
    
    // Render the view
    view.render('photoListing');
  }).done();

};