var keystone = require('keystone');

exports = module.exports = function(req, res) {
    'use strict';
  
    var view = new keystone.View(req, res),
        locals = res.locals;

    view.render('register');
};