var keystone 	= require('keystone'),
    async = require('async'),
    Race = keystone.list('Race'),
    State = keystone.list('State'),
    Gender = keystone.list('Gender'),
	Form 		= keystone.list('Form');

exports = module.exports = function(req, res) {
    'use strict';
    
    var view 	= new keystone.View(req, res),
    	locals 	= res.locals,
    	url 	= req.originalUrl.replace("/form/", "");

    async.parallel([
        function(done) {
            State.model.find().select('state').exec().then(function(states) {
                locals.states = states;
                done();
            })},
        function(done) {
            Race.model.find().select('race').exec().then(function(races) {
                locals.races = races;
                done();
            })},
        function(done) {
            Gender.model.find().select('gender').exec().then(function(genders) {
                locals.genders = genders;
                done();
            })}
    ], function() {
        
        	switch(url) {

			    case "adoption-party-family-registration-form":
			        view.render('forms/adoption-party.hbs');
			        break;

			    case "adoption-party-family-registration-form2":
			        view.render('forms/adoption-party.hbs');
			        break;

			    default:
			        view.render('form');
			}
    });

    // Fetch the page with the matching URL
    // If it exists, pass the object into the rendering
    // TODO: If it doesn't exist, forward to a 404 page
    /*
    Form.model.find()
		.where('url', req.originalUrl)
		.exec()
		.then(function (targetForm) {
			
			locals.targetForm = targetForm[0];

			// Render the view
    		view.render('form');

		});
	*/


};