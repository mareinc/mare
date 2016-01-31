var keystone = require('keystone');

exports = module.exports = function(req, res) {
    'use strict';
  
    var view = new keystone.View(req, res),
        locals = res.locals;

    // TODO: add code for a logged in user showing their previous donations/donation dates

    view.render('donate');
};