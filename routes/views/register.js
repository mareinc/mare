var keystone = require('keystone');

var Race = keystone.list('Race');

exports = module.exports = function(req, res) {
    'use strict';
  
    var view = new keystone.View(req, res),
        locals = res.locals;

        // Use the menu ID to find all page references it contains
    Race.model.find()
        .exec()
        .then(function (results) {
            
            locals.race = results;

            view.render('register');
        });

    //view.render('register');
};