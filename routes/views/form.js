var keystone = require('keystone');

exports = module.exports = function(req, res) {
    'use strict';
    
    var view = new keystone.View(req, res);

    // Fetch the page with the matching URL
    // If it exists, pass the object into the rendering
    // If it doesn't exist, forward to a 404 page
    
    // Render the view
    view.render('form');
    
};