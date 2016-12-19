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
	takenOn: { type: Types.Date, label: 'taken on', format: 'MM/DD/YYYY', required: true, initial: true },

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
	emailSentToStaff: { type: Types.Boolean, label: 'email sent to MARE staff', noedit: true },
	emailSentToInquirer: { type: Types.Boolean, label: 'information sent to inquirer',  noedit: true },
	emailSentToChildsSocialWorker: { type: Types.Boolean, label: 'email sent to child\'s social worker', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	emailSentToAgencies: { type: Types.Boolean, label: 'email sent to agencies', dependsOn: { inquiryType: 'general inquiry'}, noedit: true }

});

// TODO: Dig into the async npm module.  There's a function called auto you should look into which will determine what to call based on each functions dependencies
// Pre Save
Inquiry.schema.pre('save', function(next) {
	'use strict';

	let emailAddressInquirer			= [],
		emailAddressSocialWorker		= [],
		emailAddressesStaff				= [],
		emailAddressesAgencyContacts	= [];

	async.series([
		done => {
			console.log( '1. attemting to set social worker' );
			if( this.inquiryType !== 'general inquiry' ) {
				console.log( '1a. not a general inquiry - setting social worker' );
				this.setChildsSocialWorker( done );
			} else {
				console.log( '1b. general inquiry - abort setting social worker' );
				done();
			}
		},
		done => {
			console.log( '2.  setting agency' );
			// if it's a general inquiry, don't attempt to set the agency
			// if it's not a general inquiry and either the previous social worker value wasn't set, or the social worker was changed, recalculate the agency
			if( this.inquiryType !== 'general inquiry' && ( !this.previousChildsSocialWorker || this.previousChildsSocialWorker.toString() !== this.childsSocialWorker.toString() ) ) {
				this.setAgency( done );
				console.log( '2a. not a general inquiry and either social worker was never set or the social worker field has changed - agency set' );
			} else {
				console.log( '2b. general inquiry or either social worker was never set or the social worker field has changed - agency setting aborted' );
				done();
			}
		},
		done => {
			console.log( '3.  getting staff email addresses' );
			if( !this.emailSentToStaff ) {
				if( this.inquiryType === 'general inquiry' ) {
					emailAddressesStaff = [ 'jared.j.collier@gmail.com' ];
					// emailAddressesStaff = ['dtomaz@mareinc.org']; // TODO: this will need to be a check to see who is marked as the correct contact for these emails
					console.log( '3a. no staff email sent, but it\'s a general inquiry - hardcode staff email address' );
					done();
				} else {
					this.setStaffEmailRecipients( emailAddressesStaff, done );
					console.log( '3a. no staff email sent and not a general inquiry - staff email addresses calculated and set' );
				}
			} else {
				console.log( '3b. email already sent - staff email address setting aborted' );
				done();
			}
		},
		done => {
			console.log( '4.  sending staff emails' );
			if( !this.emailSentToStaff ) {
				this.sendEmailToStaff( emailAddressesStaff, done );
				console.log( '4a. no staff email was sent, so we sent it' );
			} else {
				console.log( '4b. email already sent or checkbox not checked - staff email send aborted' );
				done();
			}
		},
		done => {
			console.log( '5.  getting inquirer email address' );
			if( ( !this.thankYouSentToInquirer && this.thankInquirer === true ) || (!this.emailSentToInquirer && this.inquiryAccepted === true ) ) {
				this.setInquirerEmailRecipient( emailAddressInquirer, done );
				console.log( '5a. either no email sent and thank you checkbox checked or no email to inquirer sent and inquiry accepted - inquirer email address set' );
			} else {
				console.log( '5b. email already sent or checkbox not checked and email to inquirer already sent or inquiry not yet accepted - inquirer email address setting aborted' );
				done();
			}
		},
		done => {
			console.log( '6.  sending thank you email to inquirer' );
			if( !this.thankYouSentToInquirer && this.thankInquirer === true ) {
				this.sendThankYouToInquirer( emailAddressInquirer, done );
				console.log( '6a. no thank you sent and checkbox is checked - inquirer thank you sent' );
			} else {
				console.log( '6b. thank you already sent or checkbox not checked - inquirer thank you aborted' );
				done();
			}
		},
		done => {
			console.log( '7.  sending informational email to inquirer' );
			if( !this.emailSentToInquirer && this.inquiryAccepted === true ) {
				this.sendEmailToInquirer( emailAddressInquirer, done );
				console.log( '7a. no email sent and inquiry accepted - inquirer email sent' );
			} else {
				console.log( '7b. email already sent or inquiry not accepted - inquirer email aborted' );
				done();
			}
		},
		done => {
			console.log( '8.  getting social worker email address' );
			if( !this.emailSentToChildsSocialWorker && this.inquiryAccepted === true && this.inquiryType !== 'general inquiry' ) {
				this.setSocialWorkerEmailRecipient( emailAddressSocialWorker, done );
				console.log( '8a. no email already sent, inquiry accepted, and not a general inquiry - social worker email address set' );
			} else {
				console.log( '8b. email already sent, inquiry not accepted, or general inquiry - social worker email address setting aborted' );
				done();
			}
		},
		done => {
			console.log( '9.  sending social worker email' );
			if( !this.emailSentToChildsSocialWorker && this.inquiryAccepted === true && this.inquiryType !== 'general inquiry' ) {
				this.sendEmailToChildsSocialWorker( emailAddressSocialWorker, done );
				console.log( '9a. no confirmation sent, inquiry accepted, and not a general inquiry - social worker email sent' );
			} else {
				console.log( '9b. confirmation already sent, inquiry not accepted, or general inquiry - social worker email send aborted' );
				done();
			}
		},
		done => {
			console.log( '10.  getting agency contact email addresses' );
			if( !this.emailSentToAgencies && this.inquiryAccepted === true && this.inquiryType === 'general inquiry' ) {
				this.setAgencyEmailRecipients( emailAddressesAgencyContacts, done );
				console.log( '10a. no Agency emails sent, inquiry accepted and is a general inquiry - Agency contact email addresses set' );
			} else {
				console.log( '10b. email already sent, inquiry not accepted, or not a general inquiry - Agency contact email address setting aborted' );
				done();
			}
		},
		done => {
			console.log( '11.  sending agency contact email' );
			if( !this.emailSentToAgencies && this.inquiryAccepted === true && this.inquiryType === 'general inquiry') {
				this.sendEmailToAgencyContacts( emailAddressesAgencyContacts, done );
				console.log( '11a. no confirmation sent, inquiry accepted, and is a general inquiry - agency contact email sent' );
			} else {
				console.log( '11b. confirmation already sent, inquiry not accepted, or not a general inquiry - agency contact email send aborted' );
				done();
			}
		}
	], function() {

		console.log( 'emailAddressInquirer: ', emailAddressInquirer );
		console.log( 'emailAddressSocialWorker: ', emailAddressSocialWorker );
		console.log( 'emailAddressesStaff: ', emailAddressesStaff );
		console.log( 'emailAddressesAgencyContacts: ', emailAddressesAgencyContacts );

		next();
	});
});

Inquiry.schema.methods.setChildsSocialWorker = function( done ) {
	// Fetch the social worker the child is associated with and save it to the childsSocialWorkerField field
	keystone.list('Child').model.findById( this.child )
			.exec()
			.then( result => {

				this.childsSocialWorker = result.adoptionWorker;	// Set the childsSocialWorker field based on the selected child
				console.log( 'child social worker set' );
				done();

			}, err => {

				console.log(err);
				done();
			});

};

Inquiry.schema.methods.setAgency = function( done ) {
	// Fetch the agency the social worker is associated with at the time of the inquiry and save it to the agency field
	keystone.list('Social Worker').model.findById( this.childsSocialWorker )
			.exec()
			.then( result => {
				// if the child doesn't have a social worker listed, ignore setting the agency and previous social worker
				if( !result ) {
					console.log( 'no social worker was set for the child, so no agency could be found' );
				} else {
					this.agency  					= result.agency;	// Set the agency field based on the selected social worker
					this.previousChildsSocialWorker = result._id		// Set the previousChildsSocialWorker to allow for tracking to changes in the social worker bound to the inquiry
					console.log( 'agency set' );
					console.log( 'child\'s previous social worker set' );
				}

				done();

			}, err => {

				console.log( err );
				done();
			});

};

Inquiry.schema.methods.setInquirerEmailRecipient = function( emailAddressInquirer, done ) {
	// If a family made the inquiry, we need to fetch the email addresses of both contact 1 and contact 2
	if( this.inquirer === 'family' ) {

		keystone.list('Family').model.findById( this.family )
				.exec()
				.then( result => {
					emailAddressInquirer.push( result.contact1.email );
					console.log( 'inquirer email address set to contact 1\'s email for the inquiring family' );
					done();
				}, err => {
					done();
				});
	// If a social worker made the inquiry, we need to fetch their email address
	} else if(this.inquirer === 'social worker') {

		keystone.list('Social Worker').model.findById( this.socialWorker )
				.exec()
				.then(function(result) {
					emailAddressInquirer.push( result.email );
					console.log( 'inquirer email address set to inquiring social worker\'s email' );
					done();
				}, err => {
					console.log(err);
					done();
				});
	} else {

		console.error( 'an unexpected value was present for the inquirer field which prevented an email from being sent to the inquirer' );
		done();
	}

};

Inquiry.schema.methods.setStaffEmailRecipients = function( emailAddressesStaff, done ) {
	let region;
	// The region we want to match on is stored in the agency we calculated from the child's social worker.  Get the agency record.
	keystone.list('Child').model.findById( this.child )
			.exec()
			.then( child => {
				// Use the region information in the child record to match to one or more CSC region contacts, which hold a region and staff user mapping
				keystone.list( 'CSC Region Contact' ).model.find()
						.where( 'region', child.region )
						.populate( 'cscRegionContact' )			// We need the information for the contact, not just their ID
						.exec()
						.then( cscRegionContacts => {
							// Loop through the region contacts models and extract the email addresses from the cscRegionContact field which maps to a staff member
							for( cscRegionContact of cscRegionContacts ) {
								emailAddressesStaff.push( cscRegionContact.cscRegionContact.email );
								console.log( 'staff email address set' );
							};

							done();

						}, err => {
							console.log( err );
							done();
						});
			}, err => {
				console.log( err );
				done();
			})
};

Inquiry.schema.methods.setSocialWorkerEmailRecipient = function( emailAddressSocialWorker, done ) {
	// If a family made the inquiry, we need to fetch the email addresses of both contact 1 and contact 2
	keystone.list( 'Social Worker' ).model.findById( this.childsSocialWorker )
			.exec()
			.then( results => {
				emailAddressSocialWorker.push( results.email );
				console.log( 'social worker\'s email address set' );
				done();
			}, err => {
				console.log( err );
				done();
			});
};

Inquiry.schema.methods.setAgencyEmailRecipients = function( emailAddressesAgencyContacts, done ) {
	// If a family made the inquiry, we need to fetch the email addresses of both contact 1 and contact 2
	keystone.list( 'Agency' ).model.find( this.agencyReferral )
			.where( { _id: { $in: this.agencyReferral } } )
			.exec()
			.then( agencyContacts => {
				for( agencyContact of agencyContacts ) {
					emailAddressesAgencyContacts.push( agencyContact.generalInquiryContact );
					console.log( 'agency email address set' );
				};
				done();
			}, err => {
				console.log( err );
				done();
			});
};

Inquiry.schema.methods.sendEmailToStaff = function( emailAddressesStaff, done ) {
	//Find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry-staff-email'
	}).send({
		to: emailAddressesStaff,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'staff email'
	}, ( success, error ) => {
		console.log( 'success: ', success );
		console.log( 'error: ', error );
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log( 'staff email sent successfully, checking the checkbox in this model' );
		this.emailSentToStaff = true;
		done();
	});

};

Inquiry.schema.methods.sendThankYouToInquirer = function( emailAddressInquirer, done ) {
	//Find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry-inquirer-thank-you'
	}).send({
		to: emailAddressInquirer,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'thank you for your inquiry'
	}, () => {
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log( 'thank you email sent successfully, checking the checkbox in this model' );
		this.thankYouSentToInquirer = true;
		done();
	});

};

Inquiry.schema.methods.sendEmailToInquirer = function( emailAddressInquirer, done ) {
	//Find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry-inquirer-email'
	}).send({
		to: emailAddressInquirer,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'inquiry information - inquirer'
	}, () => {
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log( 'inquirer email sent successfully, checking the checkbox in this model' );
		this.emailSentToInquirer = true;
		done();
	});

};

Inquiry.schema.methods.sendEmailToChildsSocialWorker = function( emailAddressSocialWorker, done ) {
	//Find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry-social-worker-email'
	}).send({
		to: emailAddressSocialWorker,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'inquiry information - social worker'
	}, () => {
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log( 'social worker email sent successfully, checking the checkbox in this model' );
		this.emailSentToChildsSocialWorker = true;
		done();
	});
};

Inquiry.schema.methods.sendEmailToAgencyContacts = function( emailAddressesAgencyContacts, done ) {
	//Find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry-agency-contact-email'
	}).send({
		to: emailAddressesAgencyContacts,
		from: {
			name 	: 'MARE',
			email 	: 'info@mareinc.org'
		},
		subject: 'inquiry information - agency contact'
	}, () => {
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log( 'agency contact email sent successfully, checking the checkbox in this model' );
		this.emailSentToAgencies = true;
		done();
	});
};

// Define default columns in the admin interface and register the model
Inquiry.defaultColumns = 'takenOn, takenBy, child, family, socialWorker, source';
Inquiry.register();