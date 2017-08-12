const keystone					= require( 'keystone' ),
	  async 					= require( 'async' ),
	  Types 					= keystone.Field.Types,
	  inquiryMiddleware			= require( '../routes/middleware/models_inquiry' ),
	  inquiryEmailMiddleware	= require( '../routes/middleware/emails_inquiry' );

// Create model. Additional options allow menu name to be used to auto-generate the URL
var Inquiry = new keystone.List( 'Inquiry', {
	defaultSort: 'takenOn'
});

// Create fields
Inquiry.add( 'General Information', {

	takenBy: { type: Types.Relationship, label: 'taken by', ref: 'Admin', filters: { isActive: true }, required: true, initial: true },
	takenOn: { type: Types.Date, label: 'taken on', format: 'MM/DD/YYYY', required: true, initial: true },

	inquirer: { type: Types.Select, label: 'inquirer', options: 'family, social worker', default: 'family', initial: true },
	inquiryType: { type: Types.Select, label: 'inquiry type', options: 'child inquiry, complaint, family support consultation, general inquiry', required: true, initial: true },
	inquiryMethod: { type: Types.Relationship, label: 'inquiry method', ref: 'Inquiry Method', required: true, initial: true }

}, 'Inquiry Details', {

	source: { type: Types.Relationship, label: 'source', ref: 'Source', filters: { isActive: true }, required: true, initial: true },

	child: { type: Types.Relationship, label: 'child', ref: 'Child', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, many: true, initial: true },
	childsSocialWorker: { type: Types.Relationship, label: 'child\'s social worker', ref: 'Social Worker', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	previousChildsSocialWorker: { type: Types.Relationship, ref: 'Social Worker', noedit: true, hidden: true },
	family: { type: Types.Relationship, label: 'family', ref: 'Family', dependsOn: { inquirer: 'family' }, filters: { isActive: true }, initial: true },
	socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', dependsOn: { inquirer: 'social worker' }, filters: { isActive: true }, initial: true },
	onBehalfOfMAREFamily: { type: Types.Boolean, label: 'is the family registered?', default: true, dependsOn: { inquirer: 'social worker' }, initial: true },
	onBehalfOfFamily: { type: Types.Relationship, label: 'on behalf of', ref: 'Family', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: true }, filters: { isActive: true }, initial: true },
	onBehalfOfFamilyText: { type: Types.Text, label: 'on behalf of', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: false }, initial: true },
	comments: { type: Types.Textarea, label: 'comments', initial: true }

}, 'Agency', {

	agency: { type: Types.Relationship, label: 'agency at time of inquiry', ref: 'Agency', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	agencyReferrals: { type: Types.Relationship, label: 'agency referrals', ref: 'Agency', dependsOn: { inquiryType: 'general inquiry' }, filters: { isActive: true }, many: true, initial: true }

}, 'Confirmation', {

	inquiryAccepted: { type: Types.Boolean, label: 'inquiry accepted' }

}, 'Emails Sent', {

	emailSentToStaff: { type: Types.Boolean, label: 'notification email sent to MARE staff', noedit: true },
	thankYouSentToInquirer: { type: Types.Boolean, label: 'thank you sent to inquirer', noedit: true },
	thankYouSentToFamilyOnBehalfOfInquirer: { type: Types.Boolean, label: 'thank you sent to family on behalf of inquiring social worker', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: true }, noedit: true },
	approvalEmailSentToInquirer: { type: Types.Boolean, label: 'inquiry accepted information sent to inquirer',  noedit: true },
	approvalEmailSentToFamilyOnBehalfOfInquirer: { type: Types.Boolean, label: 'inquiry accepted information sent to family on behalf of inquirer', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: true }, noedit: true },
	emailSentToChildsSocialWorker: { type: Types.Boolean, label: 'inquiry accepted email sent to child\'s social worker', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	emailSentToAgencies: { type: Types.Boolean, label: 'inquiry accepted email sent to agency contacts', dependsOn: { inquiryType: 'general inquiry' }, noedit: true }

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store a map to the id in the old MARE system
	oldId: { type: Types.Text, hidden: true }

});

// TODO: Dig into the async npm module.  There's a function called auto you should look into which will determine what to call based on each functions dependencies
// Pre Save
Inquiry.schema.pre( 'save', function( next ) {
	'use strict';

	// create an object to store all calculated inquiry data for populating emails
	let inquiryData = {
		inquiryType						: this.inquiryType,
		isGeneralInquiry				: this.inquiryType === 'general inquiry',
		inquirerType					: this.inquirer,
		isFamilyInquiry					: this.inquirer === 'family',
		isSocialWorkerInquiry			: this.inquirer === 'social worker',
		childId							: this.child,
		familyId						: this.family,
		socialWorkerId					: this.socialWorker,
		agencyReferralIds				: this.agencyReferrals,
		isFamilyRegistered				: this.onBehalfOfMAREFamily ? 'yes' : 'no',
		emailAddressInquirer			: [],
		emailAddressFamilyOnBehalfOf	: [],
		emailAddressChildsSocialWorker	: [],
		emailAddressesStaff				: [],
		emailAddressesAgencyContacts	: []
	};
	// NOTE: all checks for whether to run each function below exist within the functions themselves
	async.series([
		done => { inquiryMiddleware.getChild( inquiryData, done ); },						// all inquiries except general inquiries
		done => { inquiryMiddleware.getChildsSocialWorker( inquiryData, done ); },			// all inquiries except general inquiries
		done => { inquiryMiddleware.getCSCRegionContacts( inquiryData, done ); },			// all inquiries except general inquiries
		done => { inquiryMiddleware.getOnBehalfOfFamily( this, inquiryData, done ); }, 		// social worker inquiries only
		done => { inquiryMiddleware.getOnBehalfOfFamilyState( inquiryData, done ); },		// social worker inquiries only
		done => { inquiryMiddleware.getAgencyContacts( inquiryData, done ); },				// general inquiries only
		done => { inquiryMiddleware.getInquirer( inquiryData, done ); },					// all inquiries
		done => { inquiryMiddleware.getInquirerState( inquiryData, done ); },				// all inquiries
		done => { inquiryMiddleware.getStaffInquiryContact( inquiryData, done ); },			// all inquiries
		done => { inquiryMiddleware.getSource( this.source, inquiryData, done ); },			// all inquiries
		done => { inquiryMiddleware.getMethod( this.inquiryMethod, inquiryData, done ); },	// all inquiries
		done => { inquiryMiddleware.getInquiryTakenBy( this.takenBy, inquiryData, done ); },// all inquiries

		done => { this.setDerivedFields( inquiryData, done ); },
		done => { inquiryMiddleware.setStaffEmail( inquiryData, done ); },
		done => { inquiryMiddleware.setInquirerEmail( inquiryData, done ); },
		done => { inquiryMiddleware.setSocialWorkerEmail( inquiryData, done ); },
		done => { inquiryMiddleware.setAgencyContactEmail( inquiryData, done ); },
		done => { inquiryMiddleware.formatEmailFields( inquiryData, done ); },
		done => {
			if( !this.emailSentToStaff ) {
				inquiryEmailMiddleware.sendInquiryCreatedEmailToStaff( this, inquiryData, done );
			} else {
				console.log( `staff notification email already sent - no notification email sent to staff contact` );
				done();
			}
		},
		done => {
			if( !this.thankYouSentToInquirer ) {
				inquiryEmailMiddleware.sendThankYouEmailToInquirer( this, inquiryData, done );
			} else {
				console.log( `thank you already sent - no thank you email sent to inquirer` );
				done();
			}
		},
		done => {
			if( !this.thankYouSentToFamilyOnBehalfOfInquirer && inquiryData.onBehalfOfFamily ) {
				inquiryEmailMiddleware.sendThankYouEmailToFamilyOnBehalfOfInquirer( this, inquiryData, done );
			} else {
				console.log( `thank you already sent - no thank you email sent to family on behalf of inquirer` );
				done();
			}
		},
		done => {
			if( !this.approvalEmailSentToInquirer && this.inquiryAccepted === true ) {
				inquiryEmailMiddleware.sendInquiryAcceptedEmailToInquirer( this, inquiryData, done );
			} else {
				console.log( `inquiry accepted email already sent to inquirer or 'inquiry accepted' checkbox not checked - no inquiry accepted email sent to inquirer` );
				done();
			}
		},
		done => {
			if( !this.approvalEmailSentToFamilyOnBehalfOfInquirer && this.inquiryAccepted === true && inquiryData.onBehalfOfFamily ) {
				inquiryEmailMiddleware.sendInquiryAcceptedEmailToFamilyOnBehalfOfInquirer( this, inquiryData, done );
			} else {
				console.log( `inquiry accepted email already sent to family on behalf of inquirer or 'inquiry accepted' checkbox not checked - no inquiry accepted email sent to family on behalf of inquirer` );
				done();
			}
		},
		done => {
			// TODO: do we need to check that we have a social worker saved to prevent the app from crashing?
			if( !this.emailSentToChildsSocialWorker && this.inquiryAccepted === true && this.inquiryType !== 'general inquiry' ) {
				inquiryEmailMiddleware.sendInquiryAcceptedEmailToChildsSocialWorker( this, inquiryData, done );
			} else {
				console.log( `confirmation already sent to social worker, 'inquiry accepted' checkbox not checked, or general inquiry - no inquiry accepted email sent to child's social worker` );
				done();
			}
		},
		done => {
			// TODO: do we need to check that we have agency contacts saved to prevent the app from crashing?
			if( !this.emailSentToAgencies && this.inquiryAccepted === true && this.inquiryType === 'general inquiry') {
				inquiryEmailMiddleware.sendInquiryAcceptedEmailToAgencyContacts( this, inquiryData, done );
			} else {
				console.log( `agency contact email already sent, 'inquiry accepted' checkbox not checked, or not a general inquiry - no inquiry accepted email sent to agency contacts` );
				done();
			}
		}
	], () => {

		next();
	});
});

Inquiry.schema.methods.setDerivedFields = function( inquiryData, done ) {
	// if we were able to fetch the child's record
	if( inquiryData.child ) {
		// set the child's social worker field in the inquiry
		this.childsSocialWorker = inquiryData.child.adoptionWorker;
	}

	// if we were able to fetch the child's social worker record
	if( inquiryData.childsSocialWorker ) {
		// and either the previous social worker value wasn't set, or the social worker was changed
		if( !this.previousChildsSocialWorker ||
			this.previousChildsSocialWorker.toString() !== this.childsSocialWorker.toString() ) {
			// set the agency field in the inquiry
			this.agency = inquiryData.childsSocialWorker.agency;
			// and the previous child's social worker so we can monitor for future changes
			this.previousChildsSocialWorker = inquiryData.childsSocialWorker._id;
		}
	}

	done();
}

// Define default columns in the admin interface and register the model
Inquiry.defaultColumns = 'takenOn, takenBy, child, family, socialWorker, source';
Inquiry.register();