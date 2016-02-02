var keystone = require('keystone'),
	async = require('async'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Inquiry = new keystone.List('Inquiry', {
	track: true,
	defaultSort: 'takenOn'
});

// Create fields
Inquiry.add('General Information', {

	takenBy: { type: Types.Relationship, label: 'taken by', ref: 'User', required: true, initial: true },
	takenOn: { type: Types.Text, label: 'taken on', note: 'mm/dd/yyyy', required: true, initial: true },

	inquirer: { type: Types.Select, label: 'inquirer', options: 'family, social worker', default: 'family', initial: true },
	inquiryType: { type: Types.Relationship, label: 'inquiry type', ref: 'Inquiry Type', required: true, index: true, initial: true },
	inquiryMethod: { type: Types.Relationship, label: 'inquiry method', ref: 'Inquiry Method', required: true, index: true, initial: true },

}, 'Inquiry Details', {

	source: { type: Types.Relationship, label: 'source', ref: 'Source', required: true, initial: true },

	child: { type: Types.Relationship, label: 'child', ref: 'Child', required: true, initial: true },
	childsSocialWorker: { type: Types.Relationship, label: 'child\'s social worker', ref: 'Social Worker', noedit: true, initial: true },
	previousChildsSocialWorker: { type: Types.Relationship, ref: 'Social Worker', noedit: true, hidden: true },
	prospectiveParentOrFamily: { type: Types.Relationship, label: 'familiy', ref: 'Prospective Parent or Family', dependsOn: { inquirer: 'family' }, required: true, initial: true },
	socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', dependsOn: { inquirer: 'social worker' }, initial: true },
	sendConfirmation: { type: Types.Boolean, label: 'send confirmation', initial: true },
	confirmationSent: { type: Types.Boolean, label: 'confirmation sent', default: false, noedit: true },
	comments: { type: Types.Textarea, label: 'comments', initial: true }

}, 'Agency', {

	agency: { type: Types.Relationship, label: 'agency at time of inquiry', ref: 'Agency', noedit: true }

});

// Pre Save
Inquiry.schema.pre('save', function(next) {
	'use strict';

	var self 			= this,
		emailAddresses 	= [];

	async.series([
		function(done) { self.setChildsSocialWorker(done); },
	    function(done) { self.setAgency(done); },
	    function(done) { self.setEmailRecipients(emailAddresses, done); },
	    function(done) { self.sendConfirmationEmail(emailAddresses, done); }
	], function() {
		next();
	});
});

Inquiry.schema.methods.setChildsSocialWorker = function(done) {
	var self = this;
	// Fetch the agency the social worker is associated with at the time of the inquiry and save it to the agency field
	keystone.list('Child').model.findById(self.child)
			.exec()
			.then(function(result) {
				self.childsSocialWorker = result.adoptionWorker;	// Set the agency field based on the selected social worker
				done();

			}, function(err) {
				console.log(err);
				done();
			});

};

Inquiry.schema.methods.setAgency = function(done) {
	var self = this;
	// Fetch the agency the social worker is associated with at the time of the inquiry and save it to the agency field
	keystone.list('Social Worker').model.findById(self.childsSocialWorker)
			.exec()
			.then(function(result) {

				if(!self.previousChildsSocialWorker || self.previousChildsSocialWorker.toString() !== result._id.toString()) {

					self.agency  					= result.agency;	// Set the agency field based on the selected social worker
					self.previousChildsSocialWorker = result._id		// Set the previousChildsSocialWorker to allow for tracking to changes in the social worker bound to the inquiry

					done();
				} else {
					done();
				}

			}, function(err) {
				console.log(err);
				done();
			});

};

Inquiry.schema.methods.setEmailRecipients = function(emailAddresses, done) {
	var self = this;
	// If a family made the inquiry, we need to fetch the email addresses of both contact 1 and contact 2
	if(self.inquirer === 'family') {
		keystone.list('Prospective Parent or Family').model.findById(self.prospectiveParentOrFamily)
				.exec()
				.then(function(results) {
					emailAddresses.push(results.contact1.email, results.contact2.email);
					done();
				});
	// If a social worker made the inquiry, we need to fetch their email address
	} else if(self.inquirer === 'social worker') {
		keystone.list('Social Worker').model.findById(self.socialWorker)
				.exec()
				.then(function(results) {
					emailAddresses.push(results.email);
					done();
				});
	} else {
		console.error('an unexpected value was present for the inquirer field which prevented an email from being sent to the inquirer');
		done();
	}

};

Inquiry.schema.methods.sendConfirmationEmail = function(emailAddresses, done) {
	var self = this;
	console.log('confirmation sent: ' + self.confirmationSent);

	if(!self.confirmationSent) {
		//Find the email template in templates/emails/
		new keystone.Email({
	    		templateExt: 'hbs',
	    		templateEngine: require('handlebars'),
	    		templateName: 'confirm-inquiry'
	  	}).send({
			to: emailAddresses,
			from: {
				name: 'MARE',
				email: 'info@mareinc.org'
			},
			subject: 'inquiry confirmation',
			message: 'You\'ve requested a confirmation of your inquiry, so, here it is'
		}, function() {
			// Once the email(s) have been successfully sent, we want to make a note of it using the confirmationSent field to ensure a repeat email doesn't go out
			self.confirmationSent = true;
			done();
		});
	} else {
		console.log('a confirmation email has already been sent to this person');
		done();
	}

};

// Define default columns in the admin interface and register the model
Inquiry.defaultColumns = 'takenOn, takenBy, child, prospectiveParentOrFamily, socialWorker, source';
Inquiry.register();