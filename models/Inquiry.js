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
			if( this.inquiryType !== 'general inquiry' ) {
				this.setChildsSocialWorker( done );
			} else {
				console.log( `general inquiry - abort setting child's social worker` );
				done();
			}
		},
		done => {
			// if it's a general inquiry, don't attempt to set the agency
			// if it's not a general inquiry and either the previous social worker value wasn't set, or the social worker was changed, recalculate the agency
			if( this.inquiryType !== 'general inquiry' && ( !this.previousChildsSocialWorker || this.previousChildsSocialWorker.toString() !== this.childsSocialWorker.toString() ) ) {
				this.setAgency( done );
			} else {
				console.log( `general inquiry, or social worker hasn't changed - agency setting aborted` );
				done();
			}
		},
		done => {
			if( !this.emailSentToStaff ) {
				if( this.inquiryType === 'general inquiry' ) {
					console.log( `no staff email sent, but it's a general inquiry - hardcode staff email address` );
					emailAddressesStaff = [ 'jared.j.collier@gmail.com' ];
					// emailAddressesStaff = ['dtomaz@mareinc.org']; // TODO: this will need to be a check to see who is marked as the correct contact for these emails
					done();
				} else {
					this.setStaffEmailRecipients( emailAddressesStaff, done );
				}
			} else {
				console.log( `email already sent - staff email address setting aborted` );
				done();
			}
		},
		done => {
			if( !this.emailSentToStaff ) {
				this.sendInquiryCreatedEmailToStaff( emailAddressesStaff, done );
			} else {
				console.log( `email already sent - staff email send aborted` );
				done();
			}
		},
		done => {
			if( ( !this.thankYouSentToInquirer && this.thankInquirer === true ) || (!this.emailSentToInquirer && this.inquiryAccepted === true ) ) {
				this.setInquirerEmailRecipient( emailAddressInquirer, done );
			} else {
				console.log( `thank you to inquirer already sent or checkbox not checked, and email to inquirer already sent or inquiry not yet accepted - inquirer email address setting aborted` );
				done();
			}
		},
		done => {
			if( !this.thankYouSentToInquirer && this.thankInquirer === true ) {
				this.sendThankYouEmailToInquirer( emailAddressInquirer, done );
			} else {
				console.log( `thank you already sent or checkbox not checked - inquirer thank you aborted` );
				done();
			}
		},
		done => {
			if( !this.emailSentToInquirer && this.inquiryAccepted === true ) {
				this.sendInquiryAcceptedEmailToInquirer( emailAddressInquirer, done );
			} else {
				console.log( `informational email already sent to inquirer or inquiry not accepted - inquirer email aborted` );
				done();
			}
		},
		done => {
			if( !this.emailSentToChildsSocialWorker && this.inquiryAccepted === true && this.inquiryType !== 'general inquiry' ) {
				this.setSocialWorkerEmailRecipient( emailAddressSocialWorker, done );
			} else {
				console.log( `email already sent, inquiry not accepted, or general inquiry - social worker email address setting aborted` );
				done();
			}
		},
		done => {
			if( !this.emailSentToChildsSocialWorker && this.inquiryAccepted === true && this.inquiryType !== 'general inquiry' ) {
				this.sendInquiryAcceptedEmailToChildsSocialWorker( emailAddressSocialWorker, done );
			} else {
				console.log( `confirmation already sent to social worker, inquiry not accepted, or general inquiry - social worker email send aborted` );
				done();
			}
		},
		done => {
			if( !this.emailSentToAgencies && this.inquiryAccepted === true && this.inquiryType === 'general inquiry' ) {
				this.setAgencyEmailRecipients( emailAddressesAgencyContacts, done );
			} else {
				console.log( `agency contact email already sent, inquiry not accepted, or not a general inquiry - Agency contact email address setting aborted` );
				done();
			}
		},
		done => {
			if( !this.emailSentToAgencies && this.inquiryAccepted === true && this.inquiryType === 'general inquiry') {
				this.sendInquiryAcceptedEmailToAgencyContacts( emailAddressesAgencyContacts, done );
			} else {
				console.log( `agency contact email already sent, inquiry not accepted, or not a general inquiry - agency contact email send aborted` );
				done();
			}
		}
	], function() {

		next();
	});
});

Inquiry.schema.methods.setChildsSocialWorker = function( done ) {
	// Fetch the social worker the child is associated with and save it to the childsSocialWorkerField field
	keystone.list('Child').model.findById( this.child )
			.exec()
			.then( result => {

				console.log( `not a general inquiry - setting social worker` );
				this.childsSocialWorker = result.adoptionWorker;	// Set the childsSocialWorker field based on the selected child

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
					console.log( `not a general inquiry, but no social worker was set for the child, so no agency could be found` );
				} else {
					console.log( `not a general inquiry and either social worker was never set or the social worker field has changed - setting agency and child's previous social worker` );
					this.agency  					= result.agency;	// Set the agency field based on the selected social worker
					this.previousChildsSocialWorker = result._id		// Set the previousChildsSocialWorker to allow for tracking to changes in the social worker bound to the inquiry
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
					console.log( 'either no email sent and thank you checkbox checked or no email to inquirer sent and inquiry accepted - inquirer email address set' );
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
					console.log( `inquirer email address set to inquiring social worker's email` );
					done();
				}, err => {
					console.log(err);
					done();
				});
	} else {

		console.error( `an unexpected value was present for the inquirer field which prevented an email from being sent to the inquirer` );
		done();
	}

};

Inquiry.schema.methods.setStaffEmailRecipients = function( emailAddressesStaff, done ) {
	let region;
	// The region we want to match on is stored in the agency we calculated from the child's social worker.  Get the agency record.
	keystone.list( 'Child' ).model.findById( this.child )
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
							};
							console.log( `no staff email sent and not a general inquiry - staff email addresses set to region contacts that match the child's region` );

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
				console.log( `no email already sent, inquiry accepted, and not a general inquiry - social worker email address set` );
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
				};
				console.log( `no agency contact emails sent, inquiry accepted and is a general inquiry - Agency contact email addresses set` );
				done();
			}, err => {
				console.log( err );
				done();
			});
};

Inquiry.schema.methods.sendInquiryCreatedEmailToStaff = function( emailAddressesStaff, done ) {
	let inq = this;
	//Find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry_inquiry-created-to-staff'
	}).send({
		to: emailAddressesStaff,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject: 'staff email',
		inquiry: this,
	// TODO: we should be handling success/failure better, possibly with a flash message if we can make it appear in the model screen
	}, ( error, success ) => {

		if( error ) {
			console.log( `error: ${ error }` );
			console.log( `staff email send failure, we would check the checkbox, but can't now` );
			done();
		}

		console.log( `success: ${ success }` );
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log( `staff email sent successfully, checking the checkbox in this model` );
		this.emailSentToStaff = true;
		done();
	});

};

Inquiry.schema.methods.sendThankYouEmailToInquirer = function( emailAddressInquirer, done ) {
	//Find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry_thank-you-to-inquirer'
	}).send({
		to: emailAddressInquirer,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject: 'thank you for your inquiry'
	}, ( error, success ) => {

		if( error ) {
			console.log( `error: ${ error }` );
			console.log( `thank you to inquirer email failed to send` );
			done();
		}

		console.log( 'no thank you sent and checkbox is checked - inquirer thank you sent' );
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		this.thankYouSentToInquirer = true;
		done();
	});

};

Inquiry.schema.methods.sendInquiryAcceptedEmailToInquirer = function( emailAddressInquirer, done ) {
	//Find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry_inquiry-accepted-to-inquirer'
	}).send({
		to: emailAddressInquirer,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject: 'inquiry information for inquirer'
	}, ( error, success ) => {

		if( error ) {
			console.log( `error: ${ error }`);
			console.log( `informational email to inquirer email failed to send`);
			done();
		}
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log( 'no informational email sent to inquirer and inquiry accepted - inquirer email sent and checkbox checked' );
		this.emailSentToInquirer = true;
		done();
	});

};

Inquiry.schema.methods.sendInquiryAcceptedEmailToChildsSocialWorker = function( emailAddressSocialWorker, done ) {
	//Find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry_inquiry-accepted-to-social-worker'
	}).send({
		to: emailAddressSocialWorker,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject: 'inquiry information for social worker'
	}, ( error, success ) => {

		if( error ) {
			console.log( `error: ${ error }` );
			console.log( `confirmation email to social worker failed to send` );
			done();
		}
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log( `no confirmation sent to social worker, inquiry accepted, and not a general inquiry - child's social worker email sent and checkbox checked` );
		this.emailSentToChildsSocialWorker = true;
		done();
	});
};

Inquiry.schema.methods.sendInquiryAcceptedEmailToAgencyContacts = function( emailAddressesAgencyContacts, done ) {
	//Find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry_inquiry-accepted-to-agency-contact'
	}).send({
		to: emailAddressesAgencyContacts,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject: 'inquiry information for agency contact'
	}, ( error, success ) => {

		if( error ) {
			console.log( `error: ${ error }` );
			console.log( `no agency contact email sent, inquiry accepted, and is a general inquiry - agency contact email sent` );
			done();
		}
		// Once the email(s) have been successfully sent, we want to make a note of it using the thankYouSentToInquirer field to ensure a repeat email doesn't go out
		console.log( `agency contact email sent successfully, checking the checkbox in this model` );
		this.emailSentToAgencies = true;
		done();
	});
};

// Define default columns in the admin interface and register the model
Inquiry.defaultColumns = 'takenOn, takenBy, child, family, socialWorker, source';
Inquiry.register();