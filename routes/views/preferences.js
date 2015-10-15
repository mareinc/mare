var keystone = require('keystone');

// Load model to allow fetching of user data
var User = keystone.list('User');

exports = module.exports = function(req, res) {
    'use strict';
  
    var view = new keystone.View(req, res),
        locals = res.locals;

    var userId = req.user.get('_id');

    view.render('preferences');
};