var keystone 	= require('keystone'),
	async 		= require('async'),
	_ 			= require('underscore'),
	Types 		= keystone.Field.Types;

// Create model. Additional options allow menu name to be used to auto-generate the URL
var Inquiry = new keystone.List('Inquiry', {
	track: true,
	defaultSort: 'takenOn'
});

// Create fields
Inquiry.add('General Information', {

	takenBy: { type: Types.Relationship, label: 'taken by', ref: 'Admin', required: true, initial: true },
	takenOn: { type: Types.Text, label: 'taken on', note: 'mm/dd/yyyy', required: true, initial: true },

	inquirer: { type: Types.Select, label: 'inquirer', options: 'family, social worker', default: 'family', initial: true },
	inquiryType: { type: Types.Select, label: 'inquiry type', options: 'child inquiry, complaint, family support consultation, general inquiry', required: true, initial: true },
	inquiryMethod: { type: Types.Relationship, label: 'inquiry method', ref: 'Inquiry Method', required: true, initial: true },

}, 'Inquiry Details', {

	source: { type: Types.Relationship, label: 'source', ref: 'Source', required: true, initial: true },

	child: { type: Types.Relationship, label: 'child', ref: 'Child', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, initial: true },
	childsSocialWorker: { type: Types.Relationship, label: 'child\'s social worker', ref: 'Social Worker', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	previousChildsSocialWorker: { type: Types.Relationship, ref: 'Social Worker', noedit: true, hidden: true },
	family: { type: Types.Relationship, label: 'family', ref: 'Family', dependsOn: { inquirer: 'family' }, initial: true },
	socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', dependsOn: { inquirer: 'social worker' }, initial: true },
	onBehalfOfMAREFamily: { type: Types.Boolean, label: 'is the family registered?', default: true, dependsOn: { inquirer: 'social worker' }, initial: true },
	onBehalfOfFamily: { type: Types.Relationship, label: 'on behalf of', ref: 'Family', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: true }, initial: true },
	onBehalfOfFamilyText: { type: Types.Text, label: 'on behalf of', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: false }, initial: true },
	comments: { type: Types.Textarea, label: 'comments', initial: true }

}, 'Agency', {

	agency: { type: Types.Relationship, label: 'agency at time of inquiry', ref: 'Agency', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	agencyReferral: { type: Types.Relationship, label: 'agency referrals', ref: 'Agency', dependsOn: { inquiryType: 'general inquiry' }, many: true, initial: true }

}, 'Confirmation', {

	thankInquirer: { type: Types.Boolean, label: 'send thank you to inquirer' },
	inquiryAccepted: { type: Types.Boolean, label: 'inquiry accepted' }

}, 'Emails Sent', {

	thankYouSentToInquirer: { type: Types.Boolean, label: 'thank you sent to inquirer', noedit: true },
	emailSentToCSC: { type: Types.Boolean, label: 'email sent to MARE staff', noedit: true },
	emailSentToInquirer: { type: Types.Boolean, label: 'information sent to inquirer',  noedit: true },
	emailSentToChildsSocialWorker: { type: Types.Boolean, label: 'email sent to child\'s social worker', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	emailSentToAgencies: { type: Types.Boolean, label: 'email sent to agencies', dependsOn: { inquiryType: 'general inquiry'}, noedit: true }

});

// TODO: Dig into the async npm module.  There's a function called auto you should look into which will determine what to call based on each functions dependencies
// Pre Save
Inquiry.schema.pre('save', function(next) {
	'use strict';

	var self							= this,
		emailAddressInquirer			= [],
		emailAddressSocialWorker		= [],
		emailAddressesCSC				= [],
		emailAddressesAgencyContacts	= [];

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
	    	console.log('3.  getting CSC email addresses');
	    	if(!self.emailSentToCSC) {
	    		if(self.inquiryType === 'general inquiry') {
	    			emailAddressesCSC = ['jared.j.collier@gmail.com'];
	    			// emailAddressesCSC = ['dtomaz@mareinc.org'];
	    			console.log('3a. no CSC email sent, but it\'s a general inquiry - hardcode CSC email address');
	    			done();
	    		} else {
			    	self.setCSCEmailRecipients(emailAddressesCSC, done);
			    	console.log('3a. no CSC email sent and not a general inquiry - CSC email addresses calculated and set');
			    }
		    } else {
		    	console.log('3b. email already sent - CSC email address setting aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('4.  sending CSC emails');
	    	if(!self.emailSentToCSC) {
		    	self.sendEmailToCSC(emailAddressesCSC, done);
		    	console.log('4a. no CSC email sent yet - CSC emails sent');
		    } else {
		    	console.log('4b. email already sent or checkbox not checked - CSC email send aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('5.  getting inquirer email address');
	    	if((!self.thankYouSentToInquirer && self.thankInquirer === true) || (!self.emailSentToInquirer && self.inquiryAccepted === true )) {
		    	self.setInquirerEmailRecipient(emailAddressInquirer, done);
		    	console.log('5a. either no email sent and thank you checkbox checked or no email to inquirer sent and inquiry accepted - inquirer email address set');
		    } else {
		    	console.log('5b. email already sent or checkbox not checked and email to inquirer already sent or inquiry not yet accepted - inquirer email address setting aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('6.  sending thank you email to inquirer');
	    	if(!self.thankYouSentToInquirer && self.thankInquirer === true) {
		    	self.sendThankYouToInquirer(emailAddressInquirer, done);
		    	console.log('6a. no thank you sent and checkbox is checked - inquirer thank you sent');
		    } else {
		    	console.log('6b. thank you already sent or checkbox not checked - inquirer thank you aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('7.  sending informational email to inquirer');
	    	if(!self.emailSentToInquirer && self.inquiryAccepted === true) {
		    	self.sendEmailToInquirer(emailAddressInquirer, done);
		    	console.log('7a. no email sent and inquiry accepted - inquirer email sent');
		    } else {
		    	console.log('7b. email already sent or inquiry not accepted - inquirer email aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('8.  getting social worker email address');
	    	if(!self.emailSentToChildsSocialWorker && self.inquiryAccepted === true && self.inquiryType !== 'general inquiry') {
		    	self.setSocialWorkerEmailRecipient(emailAddressSocialWorker, done);
		    	console.log('8a. no email already sent, inquiry accepted, and not a general inquiry - social worker email address set');
		    } else {
		    	console.log('8b. email already sent, inquiry not accepted, or general inquiry - social worker email address setting aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('9.  sending social worker email');
	    	if(!self.emailSentToChildsSocialWorker && self.inquiryAccepted === true && self.inquiryType !== 'general inquiry') {
		    	self.sendEmailToChildsSocialWorker(emailAddressSocialWorker, done);
		    	console.log('9a. no confirmation sent, inquiry accepted, and not a general inquiry - social worker email sent');
		    } else {
		    	console.log('9b. confirmation already sent, inquiry not accepted, or general inquiry - social worker email send aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('10.  getting agency contact email addresses');
	    	if(!self.emailSentToAgencies && self.inquiryAccepted === true && self.inquiryType === 'general inquiry') {
		    	self.setAgencyEmailRecipients(emailAddressesAgencyContacts, done);
		    	console.log('10a. no Agency emails sent, inquiry accepted and is a general inquiry - Agency contact email addresses set');
		    } else {
		    	console.log('10b. email already sent, inquiry not accepted, or not a general inquiry - Agency contact email address setting aborted');
		    	done();
		    }
	    },
	    function(done) {
	    	console.log('11.  sending agency contact email');
	    	if(!self.emailSentToAgencies && self.inquiryAccepted === true && self.inquiryType === 'general inquiry') {
		    	self.sendEmailToAgencyContacts(emailAddressesAgencyContacts, done);
		    	console.log('11a. no confirmation sent, inquiry accepted, and is a general inquiry - agency contact email sent');
		    } else {
		    	console.log('11b. confirmation already sent, inquiry not accepted, or not a general inquiry - agency contact email send aborted');
		    	done();
		    }
	    }
	], function() {
		next();
	});
});

Inquiry.schema.methods.setChildsSocialWorker = function(done) {
	var self = this;
	// Fetch the social worker the child is associated with and save it to the childsSocialWorkerField field
	keystone.list('Child').model.findById(self.child)
			.exec()
			.then(function(result) {
				self.childsSocialWorker = result.adoptionWorker;	// Set the childsSocialWorker field based on the selected child
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
		keystone.list('Family').model.findById(self.family)
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
	// The region we want to match on is stored in the agency we calculated from the child's social worker.  Get the agency record.
	keystone.list('Child').model.findById(self.child)
			.exec()
			.then(function(child) {
				// Use the region information in the child record to match to one or more CSC region contacts, which hold a region and CSC staff user mapping
				keystone.list('CSC Region Contact').model.find()
						.where('region', child.region)
						.populate('cscRegionContact')			// We need the information for the contact, not just their ID
						.exec()
						.then(function(CSCRegionContacts) {
							// Loop through the region contacts models and extract the email addresses from the cscRegionContact field which maps to a CSC staff member
							_.each(CSCRegionContacts, function(CSCRegionContacts) {
								emailAddressesCSC.push(CSCRegionContacts.cscRegionContact.email);
							});
							done();
						}, function(err) {
							console.log(err);
							done();
						});
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

Inquiry.schema.methods.setAgencyEmailRecipients = function(emailAddressesAgencyContacts, done) {
	var self = this;
	// If a family made the inquiry, we need to fetch the email addresses of both contact 1 and contact 2
	keystone.list('Agency').model.find(self.agencyReferral)
			.where({ _id: { $in: self.agencyReferral } })
			.exec()
			.then(function(agencyContacts) {
				_.each(agencyContacts, function(agencyContact) {
					emailAddressesAgencyContacts.push(agencyContact.generalInquiryContact);
				});
				done();
			}, function(err) {
				done();
			});
};

Inquiry.schema.methods.sendEmailToCSC = function(emailAddressesCSC, done) {
	var self = this;
	//Find the email template in templates/emails/
	new keystone.Email({
    		templateExt 	: 'hbs',
    		templateEngine 	: require('handlebars'),
    		templateName 	: 'inquiry-csc-email'
  	}).send({
		to: emailAddressesCSC,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'csc email'
	}, function() {
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log('csc email sent successfully, checking the checkbox in this model');
		self.emailSentToCSC = true;
		done();
	});

};

Inquiry.schema.methods.sendThankYouToInquirer = function(emailAddressInquirer, done) {
	var self = this;
	//Find the email template in templates/emails/
	new keystone.Email({
    		templateExt 	: 'hbs',
    		templateEngine 	: require('handlebars'),
    		templateName 	: 'inquiry-inquirer-thank-you'
  	}).send({
		to: emailAddressInquirer,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'thank you for your inquiry'
	}, function() {
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log('thank you email sent successfully, checking the checkbox in this model');
		self.thankYouSentToInquirer = true;
		done();
	});

};

Inquiry.schema.methods.sendEmailToInquirer = function(emailAddressInquirer, done) {
	var self = this;
	//Find the email template in templates/emails/
	new keystone.Email({
    		templateExt 	: 'hbs',
    		templateEngine 	: require('handlebars'),
    		templateName 	: 'inquiry-inquirer-email'
  	}).send({
		to: emailAddressInquirer,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'inquiry information - inquirer'
	}, function() {
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log('inquirer email sent successfully, checking the checkbox in this model');
		self.emailSentToInquirer = true;
		done();
	});

};

Inquiry.schema.methods.sendEmailToChildsSocialWorker = function(emailAddressSocialWorker, done) {
	var self = this;
	//Find the email template in templates/emails/
	new keystone.Email({
    		templateExt 	: 'hbs',
    		templateEngine 	: require('handlebars'),
    		templateName 	: 'inquiry-social-worker-email'
  	}).send({
		to: emailAddressSocialWorker,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'inquiry information - social worker'
	}, function() {
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log('social worker email sent successfully, checking the checkbox in this model');
		self.emailSentToChildsSocialWorker = true;
		done();
	});
};

Inquiry.schema.methods.sendEmailToAgencyContacts = function(emailAddressesAgencyContacts, done) {
	var self = this;
	//Find the email template in templates/emails/
	new keystone.Email({
    		templateExt 	: 'hbs',
    		templateEngine 	: require('handlebars'),
    		templateName 	: 'inquiry-agency-contact-email'
  	}).send({
		to: emailAddressesAgencyContacts,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'inquiry information - agency contact'
	}, function() {
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log('agency contact email sent successfully, checking the checkbox in this model');
		self.emailSentToAgencies = true;
		done();
	});
};

// Define default columns in the admin interface and register the model
Inquiry.defaultColumns = 'takenOn, takenBy, child, family, socialWorker, source';
Inquiry.register();