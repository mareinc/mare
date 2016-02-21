var keystone = require('keystone'),
    async = require('async'),
    _ = require('underscore'),
    Race = keystone.list('Race'),
    State = keystone.list('State'),
    Gender = keystone.list('Gender'),
    LegalStatus = keystone.list('Legal Status'),
    FamilyConstellation = keystone.list('Family Constellation'),
    SiteUser = keystone.list('Site User'),
    SocialWorker = keystone.list('Social Worker'),
    ProspectiveParentOrFamily = keystone.list('Prospective Parent or Family');

exports = module.exports = function(req, res) {
    'use strict';

    var view = new keystone.View(req, res),
        locals = res.locals;

    // Set locals
    locals.validationErrors = {};
    locals.registrationSubmitted = false;
    // Fetch all the dynamic data to fill in the form dropdown and selection areas.  Render the view once all the data has been retrieved.
    async.parallel([
        function(done) {
            State.model.find().select('state').exec().then(function(states) {

                _.each(states, function(state) {
                    if(state.state === 'Massachusetts') {
                        state['defaultSelection'] = true;
                    }
                });

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
            })},
        function(done) {
            FamilyConstellation.model.find().select('familyConstellation').exec().then(function(familyConstellations) {
                locals.familyConstellations = familyConstellations;
                done();
            })},
        function(done) {
            LegalStatus.model.find().select('legalStatus').exec().then(function(legalStatuses) {
                locals.legalStatuses = legalStatuses;
                done();
            })}
    ], function() {
        view.render('register');
    });

    // On a POST request...
    // Save the new user item to the database.
    // The Model sends a welcome email after save.
    view.on('post', { action: 'register' }, function(next) {


         var user               = req.body,
             registrationType   = user.registrationType;


        if(registrationType === 'siteVisitor'){

            var newUser = new SiteUser.model({

                name: {
                    first   : user.firstName,
                    last    : user.lastName
                },

                password    : user.password,
                email       : user.email,

                phone: {
                    mobile  : user.mobilePhone,
                    home    : user.homePhone
                },

                address: {
                    street1 : user.street1,
                    street2 : user.street2,
                    city    : user.city,
                    state   : user.state,
                    zipCode : user.zipCode
                }
            });


            /*
             * THIS IS HOW YOU FLASH A MESSAGE, MUST BE AN OBJECT
            req.flash('error', {
                    title: 'Success!',
                    detail: 'A new site visitor has been added.'
                });

            res.redirect('/register/');
            */
        }
        else if(registrationType === 'socialWorker') {
            /*
            var newUser = new SocialWorker.model({

                name: {
                    first   : user.firstName,
                    last    : user.lastName
                },

                password    : user.password,
                email       : user.email,
                phone       : user.phone,

                address     : {
                    street1 : user.street1,
                    street2 : user.street2,
                    city    : user.city,
                    state   : user.state,
                    zipCode : user.zipCode,
                },

                agency      : user.agency,
                title       : user.title
            });
            */
        }
        else if(registrationType === 'prospectiveParent') {

            /*
            var newUser = new ProspectiveParentOrFamily.model({

            });
            */
        }

        newUser.save(function(err){
            if(err){
                console.log(err);
            }
            else{
                locals.registrationSubmitted=true;
                //return res.redirect('/register/');
            }
            next();
        });

        //next();
    });
};
