var keystone = require('keystone');

// Load model to allow fetching of children data
var Child = keystone.list('Child');

exports = module.exports = function(req, res) {
    'use strict';
  
    var locals = res.locals;
    
    var view = new keystone.View(req, res);

    // Use the menu ID to find all page references it contains
    Child.model.find()
        .exec()
        .then(function (results) {
            
            locals.children = results;

            view.render('photoListing');
        });

};