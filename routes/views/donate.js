var keystone = require('keystone');

exports = module.exports = function(req, res) {
    'use strict';

    var view = new keystone.View(req, res),
        locals = res.locals;

    // TODO: add code for a logged in user showing their previous donations/donation dates

    // Set the layout to render with the right sidebar
	locals['render-with-sidebar'] = false;
    // Render the view once all the data has been retrieved
    view.render('donate');
};