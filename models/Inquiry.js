const keystone					= require( 'keystone' ),
	  async 					= require( 'async' ),
	  Types 					= keystone.Field.Types,
	  inquiryMiddleware			= require( '../routes/middleware/models_inquiry' ),
	  inquiryEmailService		= require( '../routes/middleware/emails_inquiry' ),
	  childService				= require( '../routes/middleware/service_child' ),
	  socialWorkerService		= require( '../routes/middleware/service_social-worker' ),
	  CSCRegionContactService 	= require( '../routes/middleware/service_CSC-region-contact' );

// Create model. Additional options allow menu name to be used to auto-generate the URL
var Inquiry = new keystone.List( 'Inquiry', {
	defaultSort: '-takenOn'
});

// Create fields
Inquiry.add( 'General Information', {
	takenBy: { type: Types.Relationship, label: 'taken by', ref: 'Admin', filters: { isActive: true }, required: true, initial: true },
	takenOn: { type: Types.Date, label: 'taken on', format: 'MM/DD/YYYY', required: true, initial: true },

	inquirer: { type: Types.Select, label: 'inquirer', options: 'site visitor, family, social worker', default: 'family', initial: true },
	inquiryType: { type: Types.Select, label: 'inquiry type', options: 'child inquiry, complaint, family support consultation, general inquiry', required: true, initial: true },
	inquiryMethod: { type: Types.Relationship, label: 'inquiry method', ref: 'Inquiry Method', required: true, initial: true }

}, 'Inquiry Details', {
	isSourceUnlisted: { type: Types.Boolean, label: `source isn't listed`, default: false, initial: true },
	source: { type: Types.Relationship, label: 'source', ref: 'Source', dependsOn: { isSourceUnlisted: false }, filters: { isActive: true }, initial: true },
	sourceText: { type: Types.Text, label: 'source', dependsOn: { isSourceUnlisted: true }, initial: true },
	additionalSources: { type: Types.Relationship, label: 'additional sources', ref: 'Source', filters: { isActive: true }, many: true, initial: true },

	children: { type: Types.Relationship, label: 'children', ref: 'Child', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, many: true, initial: true },
	childsSocialWorker: { type: Types.Relationship, label: 'child\'s social worker', ref: 'Social Worker', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	siteVisitor: { type: Types.Relationship, label: 'site visitor', ref: 'Site Visitor', dependsOn: { inquirer: 'site visitor' }, filters: { isActive: true }, initial: true },
	family: { type: Types.Relationship, label: 'family', ref: 'Family', dependsOn: { inquirer: 'family' }, filters: { isActive: true }, initial: true },
	socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', dependsOn: { inquirer: 'social worker' }, filters: { isActive: true }, initial: true },
	onBehalfOfMAREFamily: { type: Types.Boolean, label: 'is the family registered?', default: true, dependsOn: { inquirer: 'social worker' }, initial: true },
	onBehalfOfFamily: { type: Types.Relationship, label: 'on behalf of', ref: 'Family', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: true }, filters: { isActive: true }, initial: true },
	onBehalfOfFamilyText: { type: Types.Text, label: 'on behalf of', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: false }, initial: true },
	comments: { type: Types.Textarea, label: 'comments', initial: true }

}, 'Agency', {

	childAgency: { type: Types.Relationship, label: `child's agency at time of inquiry`, ref: 'Agency', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
	familyAgency: { type: Types.Relationship, label: `family's agency at time of inquiry`, ref: 'Agency', dependsOn: { inquiryType: 'general inquiry' }, noedit: true },
	agencyReferrals: { type: Types.Relationship, label: 'agency referrals', ref: 'Agency', dependsOn: { inquiryType: 'general inquiry' }, filters: { isActive: true }, many: true, initial: true }

}, 'Confirmation', {

	inquiryAccepted: { type: Types.Boolean, label: 'inquiry accepted' }

}, 'Emails Sent', {

	thankYouSentToFamilyOnBehalfOfInquirer: { type: Types.Boolean, label: 'thank you sent to family on behalf of inquiring social worker', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: true }, noedit: false },
	approvalEmailSentToInquirer: { type: Types.Boolean, label: 'inquiry accepted information sent to inquirer',  noedit: false },
	approvalEmailSentToFamilyOnBehalfOfInquirer: { type: Types.Boolean, label: 'inquiry accepted information sent to family on behalf of inquirer', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: true }, noedit: false },
	emailSentToChildsSocialWorker: { type: Types.Boolean, label: 'inquiry accepted email sent to child\'s social worker', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: false },
	emailSentToAgencies: { type: Types.Boolean, label: 'inquiry accepted email sent to agency contacts', dependsOn: { inquirer: 'family' }, noedit: false }

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store a map to the id in the old MARE system
	oldId: { type: Types.Text, hidden: true }

});

// Pre Save
Inquiry.schema.pre( 'save', function( next ) {
	'use strict';
next();
	// attempt to populate any derived fields for child inquiries
	// this.populateDerivedFields()
	// 	// if there was an error populating the derived fields, log the error
	// 	.catch( err => console.error( `error populating fields for inquiry with id ${ this.get( '_id' ) } - ${ err }` ) )
	// 	// call next to allow the model to save
	// 	.then( () => next() )

		// if( !this.thankYouSentToFamilyOnBehalfOfInquirer && inquiryData.onBehalfOfFamily ) {
		// 	inquiryEmailService.sendThankYouEmailToFamilyOnBehalfOfInquirer( this, inquiryData, done );
		// }

		// if( !this.approvalEmailSentToInquirer && this.inquiryAccepted === true ) {
		// 	inquiryEmailService.sendInquiryAcceptedEmailToInquirer( this, inquiryData, done );
		// }

		// if( !this.approvalEmailSentToFamilyOnBehalfOfInquirer && this.inquiryAccepted === true && inquiryData.onBehalfOfFamily ) {
		// 	inquiryEmailService.sendInquiryAcceptedEmailToFamilyOnBehalfOfInquirer( this, inquiryData, done );
		// }

		// // TODO: do we need to check that we have a social worker saved to prevent the app from crashing?
		// if( !this.emailSentToChildsSocialWorker && this.inquiryAccepted === true && this.inquiryType !== 'general inquiry' ) {
		// 	inquiryEmailService.sendInquiryAcceptedEmailToChildsSocialWorker( this, inquiryData, done );
		// }

		// // TODO: do we need to check that we have agency contacts saved to prevent the app from crashing?
		// if( !this.emailSentToAgencies && this.inquiryAccepted === true && this.inquiryType === 'general inquiry') {
		// 	inquiryEmailService.sendInquiryAcceptedEmailToAgencyContacts( this, inquiryData, done );
		// }
	// });

	// create an object to store all calculated inquiry data for populating emails
	// let inquiryData = {
	// 	inquiryType						: this.inquiryType,
	// 	isGeneralInquiry				: this.inquiryType === 'general inquiry',
	// 	inquirerType					: this.inquirer,
	// 	isSiteVisitor					: this.inquirer === 'site visitor',
	// 	isFamilyInquiry					: this.inquirer === 'family',
	// 	isSocialWorkerInquiry			: this.inquirer === 'social worker',
	// 	childId							: this.child,
	// 	siteVisitorId					: this.siteVisitor,
	// 	familyId						: this.family,
	// 	socialWorkerId					: this.socialWorker,
	// 	agencyReferralIds				: this.agencyReferrals,
	// 	isFamilyRegistered				: this.onBehalfOfMAREFamily ? 'yes' : 'no',
	// 	emailAddressInquirer			: [],
	// 	emailAddressFamilyOnBehalfOf	: [],
	// 	emailAddressChildsSocialWorker	: [],
	// 	emailAddressesStaff				: [],
	// 	emailAddressesAgencyContacts	: []
	// };

	// begin a promise chain
	// Promise.resolve()
	// 	.then( () => {
	// 		// non-general inquiries will attempt to fetch the child specified in the child field
	// 		// general inquiries don't need to process child information and will return undefined
	// 		return inquiryData.inquiryType !== 'general inquiry' ?
	// 			   // REFACTOR NOTE: original just populates 'status', but as of now I don't see why 'status' needs to be populated
	// 			   childService.getChildById({ child: this.child,
	// 										   fieldsToPopulate: [ 'status', 'adoptionWorker', 'region' ] } ) :
	// 			   undefined
	// 	})
	// 	// if the child was fetched successfully, add them to the inquiryData object for future reference
	// 	.then( child => inquiryData.child = child )
	// 	// if the child wasn't fetched successfully, log an error
	// 	.catch( err => console.error( `error fetching child for ${ inquiryData.inquiryType } ${ this.get( '_id' ) } - ${ err }` ) )
	// 	// fetch the child's social worker
	// 	.then( () => {
	// 		// if a child should have been fetched, but wasn't
	// 		if( inquiryData.inquiryType !== 'general inquiry' && !inquiryData.child ) {
	// 			// thow an error to ensure the next catch block is hit
	// 			throw new Error( `child was not fetched properly` );
	// 		}
	// 		// non-general inquiries will attempt to fetch the child's social worker
	// 		// general inquiries will return undefined
	// 		return inquiryData.child ?
	// 			   socialWorkerService.getSocialWorkerById( inquiryData.child.adoptionWorker ) :
	// 			   undefined;
	// 	})
	// 	// if the child's social worker was fetched successfully, add them to the inquiryData object for future reference
	// 	.then( socialWorker => inquiryData.childsSocialWorker = socialWorker )
	// 	// if there was an error fetching the child's social worker, log the error
	// 	.catch( err => console.error( `error fetching the CSC region contact for ${ inquiryData.inquiryType } ${ this.get( '_id' ) } - ${ err }` ) )
	// 	// fetch the CSC contact for the child's region
	// 	// REFACTOR NOTE: not applicable for general inquiries, would set inquiryData.childsSocialWorker and inquiryData.hasChildsSocialWorker
	// 	.then( () => {
	// 		// if a child should have been fetched, but wasn't
	// 		if( inquiryData.inquiryType !== 'general inquiry' && !inquiryData.child ) {
	// 			// thow an error to ensure the next catch block is hit
	// 			throw new Error( `child was not fetched properly` );
	// 		}
	// 		// non-general inquiries will attempt to fetch the CSC contact for the child's region
	// 		// general inquiries will return undefined
	// 		return inquiryData.child ?
	// 			   CSCRegionContactService.getCSCRegionContactById( inquiryData.child.region, [ 'cscRegionContact' ] ) :
	// 			   undefined;
	// 	})
	// 	// if the CSC region contact was fetched successfully, add them to the inquiryData object for future reference
	// 	.then( CSCRegionContact => inquiryData.CSCRegionContact = CSCRegionContact )
	// 	// if there was an error fetching the CSC region contact, log the error
	// 	.catch( err => console.error( `error fetching the CSC region contact for ${ inquiryData.inquiryType } ${ this.get( '_id' ) } - ${ err }` ) )


	// NOTE: all checks for whether to run each function below exist within the functions themselves

	// async.series([
	// 	// done => { inquiryMiddleware.getChild( inquiryData, done ); },						// all inquiries except general inquiries
	// 	done => { inquiryMiddleware.getChildsSocialWorker( inquiryData, done ); },			// all inquiries except general inquiries
	// 	done => { inquiryMiddleware.getCSCRegionContacts( inquiryData, done ); },			// all inquiries except general inquiries
	// 	// done => { inquiryMiddleware.getOnBehalfOfFamily( this, inquiryData, done ); }, 		// social worker inquiries only
	// 	// done => { inquiryMiddleware.getOnBehalfOfFamilyState( inquiryData, done ); },		// social worker inquiries only
	// 	// done => { inquiryMiddleware.getAgencyContacts( inquiryData, done ); },				// general inquiries only
	// 	// done => { inquiryMiddleware.getInquirer( inquiryData, done ); },					// all inquiries
	// 	// done => { inquiryMiddleware.getInquirerState( inquiryData, done ); },				// all inquiries
	// 	done => { inquiryMiddleware.getStaffInquiryContact( inquiryData, done ); },			// all inquiries
	// 	// done => { inquiryMiddleware.getSource( this.source, inquiryData, done ); },			// all inquiries
	// 	// done => { inquiryMiddleware.getMethod( this.inquiryMethod, inquiryData, done ); },	// all inquiries
	// 	// done => { inquiryMiddleware.getInquiryTakenBy( this.takenBy, inquiryData, done ); },// all inquiries

	// 	done => { this.setDerivedFields( inquiryData, done ); },
	// 	done => { inquiryMiddleware.setStaffEmail( inquiryData, done ); },
	// 	done => { inquiryMiddleware.setInquirerEmail( inquiryData, done ); },
	// 	done => { inquiryMiddleware.setSocialWorkerEmail( inquiryData, done ); },
	// 	done => { inquiryMiddleware.setAgencyContactEmail( inquiryData, done ); },
	// 	done => { inquiryMiddleware.formatEmailFields( inquiryData, done ); },
		
	// ], () => {

	// 	next();
	// });
});

Inquiry.schema.methods.populateDerivedFields = function() {

	return new Promise( ( resolve, reject ) => {
		// populate the inquiry Relationship fields
		this.populate( [ 'children' ], err => {
			// if there was an error populating the specified fields on the inquiry model
			if ( err ) {
				// reject the promise with details of the error, preventing the rest of the function from executing
				return reject( `error populating inquiry fields with id ${ this.get( '_id' ) }` );
			}

			const firstChild = this.get( 'children' ).length > 0 ? this.get( 'children' )[ 0 ] : undefined;
			
			// if there are no saved children, or it's a general inquiry
			if( !firstChild || this.get( 'inquiryType' ) === 'general inquiry' ) {
				// resolve the promise, preventing the rest of the function from executing
				return resolve();
			}
			// populate the necessary fields on the firstChild model
			firstChild.populate( 'adoptionWorker', err => {
				// if there was an error populating the child model fields
				if ( err ) {
					// reject the promise with details of the error, preventing the rest of the function from executing
					return reject( `error populating child with registration number ${ firstChild.get( 'registrationNumber' ) } for inquiry with id ${ this.get( '_id' ) }` );
				}
				// store the child's adoption worker
				const adoptionWorker = firstChild.get( 'adoptionWorker' );
				// if the child's adoption worker field is set
				if( adoptionWorker ) {
					// store commonly used values
					const adoptionWorkersId		= adoptionWorker.get( '_id' ),
						childsSocialWorkerId	= this.get( 'childsSocialWorker' ),
						previousAdoptionWorker	= this.get( 'previousChildsSocialWorker' );
					// if the child's social worker field was never set or has changed
					if( !childsSocialWorkerId || childsSocialWorkerId.toString() !== adoptionWorkersId.toString() ) {
						// set the child's social worker field to the id of the child's adoption worker
						this.set( 'childsSocialWorker', adoptionWorkersId );
					}
					// if either the previous social worker value wasn't set, or the adoption worker has changed
					if( !this.get( 'agency' ) ) {
						// set the agency field to the agency associated with the child's adoption worker
						this.set( 'agency', adoptionWorker.get( 'agency' ) );
					}

					resolve();
				}
			});
		});
	});
};

// Define default columns in the admin interface and register the model
Inquiry.defaultColumns = 'takenOn, takenBy, source, children, family';
Inquiry.register();