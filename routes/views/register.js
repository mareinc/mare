var keystone = require('keystone');
var Race = keystone.list('Race');
var State = keystone.list('State');

var SiteUser = keystone.list('Site User');

//var SocialWorker = keystone.list('Social Worker');
//var ProspectiveParentOrFamily = new keystone.List('Prospective Parent or Family');


exports = module.exports = function(req, res) {
    'use strict';
      
    var view = new keystone.View(req, res),
        locals = res.locals;

    // Set locals
    locals.validationErrors = {};
    locals.registrationSubmitted = false;
    

    //On a GET request...
    //Get all options for Race/Ethnicity checkboxes
    view.on('get', function(next) {

        Race.model.find()
            .exec()
            .then(function (results) {
                
                locals.race = results;

                //Then get all options for the State dropdown
                State.model.find()
                    .exec()
                    .then(function (results) {
                        locals.state = results;
                        next();
                    });

                //next();
            });
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

    view.render('register');
};
