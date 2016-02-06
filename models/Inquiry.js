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
	inquiryType: { type: Types.Select, label: 'inquiry type', options: 'child inquiry, complaint, family support consultation, general inquiry', required: true, initial: true },
	inquiryMethod: { type: Types.Relationship, label: 'inquiry method', ref: 'Inquiry Method', required: true, index: true, initial: true },

}, 'Inquiry Details', {

	source: { type: Types.Relationship, label: 'source', ref: 'Source', required: true, initial: true },

	child: { type: Types.Relationship, label: 'child', ref: 'Child', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, initial: true },
	childsSocialWorker: { type: Types.Relationship, label: 'child\'s social worker', ref: 'Social Worker', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	previousChildsSocialWorker: { type: Types.Relationship, ref: 'Social Worker', noedit: true, hidden: true },
	prospectiveParentOrFamily: { type: Types.Relationship, label: 'familiy', ref: 'Prospective Parent or Family', dependsOn: { inquirer: 'family' }, initial: true },
	socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', dependsOn: { inquirer: 'social worker' }, initial: true },
	onBehalfOfMAREFamily: { type: Types.Boolean, label: 'is the family registered?', default: true, dependsOn: { inquirer: 'social worker' }, initial: true },
	onBehalfOfFamily: { type: Types.Relationship, label: 'on behalf of', ref: 'Prospective Parent or Family', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: true }, initial: true },
	onBehalfOfFamilyText: { type: Types.Text, label: 'on behalf of', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: false }, initial: true },
	comments: { type: Types.Textarea, label: 'comments', initial: true }

}, 'Agency', {

	agency: { type: Types.Relationship, label: 'agency at time of inquiry', ref: 'Agency', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	agencyReferral: { type: Types.Relationship, label: 'agency referrals', ref: 'Agency', dependsOn: { inquiryType: 'general inquiry' }, many: true, initial: true }

}, 'Confirmation', {

	sendConfirmationToInquirer: { type: Types.Boolean, label: 'send confirmation to inquirer' },
	sendConfirmationToChildsSocialWorker: { type: Types.Boolean, label: 'send confirmation to child\'s social worker', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] } }

}, 'Emails Sent', {

	confirmationSentToInquirer: { type: Types.Boolean, label: 'confirmation sent to inquirer',  noedit: true },
	confirmationSentToCSC: { type: Types.Boolean, label: 'confirmation sent to CSC staff', noedit: true },
	confirmationSentToChildsSocialWorker: { type: Types.Boolean, label: 'confirmation sent to child\'s social worker', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true }

});

// 1 Set social worker from child [  ]
//   2 Set agency from social worker [ 1 ]

//   3 get inquirer email address [  ]
//     4 send inquirer email [ 3 ]

//   5 get CSC contact email addresses [ 2 ]
//     6 send CSC contact emails [ 5 ]

//   7 get social worker email address [ 1 ]
//     8 send social worker email [ 7 ]

// TODO: Dig into the async npm module.  There's a function called auto you should look into which will determine what to call based on each functions dependencies
// Pre Save
Inquiry.schema.pre('save', function(next) {
	'use strict';

	var self 						= this,
		emailAddressInquirer 		= [],
		emailAddressSocialWorker 	= [],
		emailAddressesCSC 			= [];

	async.series([
		function(done) {
			console.log('1. setting social worker');
			if(self.inquiryType !== 'general inquiry') {
				self.setChildsSocialWorker(done);
				console.log('1a. not a general inquiry - social worker set');
			} else {
				console.log('1b. general inquiry - abort setting social worker');
				done();
			}
		},
	    function(done) {
	    	console.log('2.  setting agency');
	    	// if it's a general inquiry, don't attempt to set the agency
	    	// if it's not a general inquiry and either the previous social worker value wasn't set, or the social worker was changed, recalculate the agency
			if(self.inquiryType !== 'general inquiry' && (!self.previousChildsSocialWorker || self.previousChildsSocialWorker.toString() !== self.childsSocialWorker.toString())) {
	    		self.setAgency(done);
	    		console.log('2a. not a general inquiry and either social worker was never set or the social worker field has changed - agency set');
	    	} else {
	    		console.log('2b. general inquiry or either social worker was never set or the social worker field has changed - agency setting aborted');
	    		done();
	    	}
	   	},
	    function(done) {
	    	console.log('3.  getting inquirer email address');
	    	if(!self.confirmationSentToInquirer && self.sendConfirmationToInquirer === true) {
		    	self.setInquirerEmailRecipient(emailAddressInquirer, done);
		    	console.log('3a. no confirmation already sent and checkbox checked - inquirer email address set');
		    } else {
		    	console.log('3b. confirmation already sent or checkbox not checked - inquirer email address setting aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('4.  sending inquirer email');
	    	if(!self.confirmationSentToInquirer && self.sendConfirmationToInquirer === true) {
	    		console.log('in 4a');
		    	self.sendConfirmationEmailToInquirer(emailAddressInquirer, done);
		    	console.log('4a. no confirmation sent and checkbox is checked - inquirer email sent');
		    } else {
		    	console.log('4b. confirmation already sent or checkbox not checked - inquirer email send aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('5.  getting CSC email addresses');
	    	if(!self.confirmationSentToCSC && self.sendConfirmationToInquirer === true) {
	    		console.log('in 5a');
		    	self.setCSCEmailRecipients(emailAddressesCSC, done);
		    	console.log('5a. no confirmation already sent and checkbox checked - CSC email addresses set');
		    } else {
		    	console.log('5b. confirmation already sent or checkbox not checked - CSC email address setting aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('6.  sending CSC emails');
	    	if(!self.confirmationSentToCSC && self.sendConfirmationToInquirer === true) {
	    		console.log('in 6a');
		    	self.sendConfirmationEmailToCSC(emailAddressesCSC, done);
		    	console.log('6a. no confirmation sent and checkbox is checked - CSC emails sent');
		    } else {
		    	console.log('6b. confirmation already sent or checkbox not checked - CSC email send aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('7.  getting social worker email address');
	    	if(!self.confirmationSentToChildsSocialWorker && self.sendConfirmationToChildsSocialWorker === true) {
	    		console.log('in 7a');
		    	self.setSocialWorkerEmailRecipient(emailAddressSocialWorker, done);
		    	console.log('7a. no confirmation already sent and checkbox checked - social worker email address set');
		    } else {
		    	console.log('7b. confirmation already sent or checkbox not checked - social worker email address setting aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('8.  sending social worker email');
	    	if(!self.confirmationSentToChildsSocialWorker && self.sendConfirmationToChildsSocialWorker === true) {
	    		console.log('in 8a');
		    	self.sendConfirmationEmailToChildsSocialWorker(emailAddressSocialWorker, done);
		    	console.log('8a. no confirmation sent and checkbox is checked - social worker email sent');
		    } else {
		    	console.log('8b. confirmation already sent or checkbox not checked - social worker email send aborted');
		    	done();
		    }
	    }
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

				self.agency  					= result.agency;	// Set the agency field based on the selected social worker
				self.previousChildsSocialWorker = result._id		// Set the previousChildsSocialWorker to allow for tracking to changes in the social worker bound to the inquiry

				done();

			}, function(err) {
				console.log(err);
				done();
			});

};

Inquiry.schema.methods.setInquirerEmailRecipient = function(emailAddressInquirer, done) {
	var self = this;
	// If a family made the inquiry, we need to fetch the email addresses of both contact 1 and contact 2
	if(self.inquirer === 'family') {
		keystone.list('Prospective Parent or Family').model.findById(self.prospectiveParentOrFamily)
				.exec()
				.then(function(results) {
					emailAddressInquirer.push(results.contact1.email);
					done();
				}, function(err) {
					done();
				});
	// If a social worker made the inquiry, we need to fetch their email address
	} else if(self.inquirer === 'social worker') {
		keystone.list('Social Worker').model.findById(self.socialWorker)
				.exec()
				.then(function(results) {
					emailAddressInquirer.push(results.email);
					done();
				}, function(err) {
					console.log(err);
					done();
				});
	} else {
		console.error('an unexpected value was present for the inquirer field which prevented an email from being sent to the inquirer');
		done();
	}

};

Inquiry.schema.methods.setCSCEmailRecipients = function(emailAddressesCSC, done) {
	var self = this,
		region;

	keystone.list('Agency').model.findById(self.agency)
			.exec()
			.then(function(results) {
				region = results.address.region;
				console.log(region);
				done();
			}, function(err) {
				console.log(err);
				done();
			})
};

Inquiry.schema.methods.setSocialWorkerEmailRecipient = function(emailAddressSocialWorker, done) {
	var self = this;
	// If a family made the inquiry, we need to fetch the email addresses of both contact 1 and contact 2
	keystone.list('Social Worker').model.findById(self.childsSocialWorker)
			.exec()
			.then(function(results) {
				emailAddressSocialWorker.push(results.email);
				done();
			}, function(err) {
				done();
			});

};

Inquiry.schema.methods.sendConfirmationEmailToInquirer = function(emailAddressInquirer, done) {
	var self = this;
	console.log('inquirer email: ' + emailAddressInquirer);

	//Find the email template in templates/emails/
	new keystone.Email({
    		templateExt 	: 'hbs',
    		templateEngine 	: require('handlebars'),
    		templateName 	: 'inquiry-confirmation'
  	}).send({
		to: emailAddressInquirer,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'inquiry confirmation'
	}, function() {
		// Once the email(s) have been successfully sent, we want to make a note of it using the confirmationSentToInquirer field to ensure a repeat email doesn't go out
		console.log('email sent successfully, checking the checkbox in this model');
		self.confirmationSentToInquirer = true;
		done();
	});

};

Inquiry.schema.methods.sendConfirmationEmailToCSC = function(emailAddressesCSC, done) {
	var self = this;
	console.log('email addresses CSC: '+ emailAddressesCSC);

	console.log('sending email to CSC contacts');

	done();

};

Inquiry.schema.methods.sendConfirmationEmailToChildsSocialWorker = function(emailAddressSocialWorker, done) {
	var self = this;
	console.log('social worker email: ' + emailAddressSocialWorker);

	//Find the email template in templates/emails/
	new keystone.Email({
    		templateExt 	: 'hbs',
    		templateEngine 	: require('handlebars'),
    		templateName 	: 'inquiry-social-worker-notification'
  	}).send({
		to: emailAddressSocialWorker,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'inquiry confirmation'
	}, function() {
		// Once the email(s) have been successfully sent, we want to make a note of it using the confirmationSentToInquirer field to ensure a repeat email doesn't go out
		console.log('email sent successfully, checking the checkbox in this model');
		self.confirmationSentToInquirer = true;
		done();
	});
};

// Define default columns in the admin interface and register the model
Inquiry.defaultColumns = 'takenOn, takenBy, child, prospectiveParentOrFamily, socialWorker, source';
Inquiry.register();