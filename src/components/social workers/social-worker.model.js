require( '../change histories/social-worker-history.model' );

const keystone					= require( 'keystone' ),
	  async 					= require( 'async' ),
	  Types						= keystone.Field.Types,
	  User						= require( '../users/user.model' ),
	  MailchimpService			= require( '../../components/mailchimp lists/mailchimp-list.controllers' ),
	  ChangeHistoryMiddleware	= require( '../change histories/change-history.controllers' ),
	  UserServiceMiddleware		= require( '../../components/users/user.controllers' ),
	  Validators  				= require( '../../utils/field-validator.controllers' );

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list that comes later when sorting alphabetically
const ContactGroup = require( '../contact groups/contact-group.model' );

// configure the s3 storage adapters
const imageStorage = new keystone.Storage({
	adapter: require( 'keystone-storage-adapter-s3' ),
	s3: {
		key: process.env.S3_KEY, // required; defaults to process.env.S3_KEY
		secret: process.env.S3_SECRET, // required; defaults to process.env.S3_SECRET
		bucket: process.env.S3_BUCKET_NAME, // required; defaults to process.env.S3_BUCKET
		region: process.env.S3_REGION, // optional; defaults to process.env.S3_REGION, or if that's not specified, us-east-1
		path: '/social-workers/images',
		// use the file name with spaces replaced by dashes instead of randomly generating a value
		// NOTE: this is needed to prevent access errors when trying to view the files
		generateFilename: file => file.originalname.replace( /\s/g, '-' ),
		publicUrl: file => `${ process.env.CLOUDFRONT_URL }/social-workers/images/${ file.originalname.replace( /\s/g, '-' ) }`
	},
	schema: {
		bucket: true, // optional; store the bucket the file was uploaded to in your db
		etag: true, // optional; store the etag for the resource
		path: true, // optional; store the path of the file in your db
		url: true // optional; generate & store a public URL
	}
});

// Create model
const SocialWorker = new keystone.List( 'Social Worker', {
	inherits	: User,
	track		: true,
	map			: { name: 'name.full' },
	defaultSort	: 'name.full',
	hidden		: false
});

// Create fields
SocialWorker.add( 'Permissions', {

	isActive: { type: Types.Boolean, label: 'is active with agency' },

	permissions: {
		isVerified: { type: Types.Boolean, label: 'has a verified email address', default: false, noedit: true },
		canViewAllChildren: { type: Types.Boolean, label: 'verified access to legal risk children', default: false }
	}

}, 'General Information', {

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	avatar: { type: Types.File, storage: imageStorage, label: 'avatar' },

	contactGroups: { type: Types.Relationship, label: 'contact groups', ref: 'Contact Group', many: true, initial: true }

}, 'Contact Information', {

	phone: {
		work: { type: Types.Text, label: 'work phone number', initial: true, validate: Validators.phoneValidator },
		mobile: { type: Types.Text, label: 'mobile phone number', initial: true, validate: Validators.phoneValidator },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, mobile', initial: true }
    }

}, 'Social Worker Information', {

	positions: { type: Types.Relationship, label: 'positions', ref: 'Social Worker Position', many: true, initial: true },
	agency: { type: Types.Relationship, label: 'agency', ref: 'Agency', filters: { isActive: true }, initial: true },
	agencyNotListed: { type: Types.Boolean, label: `agency isn't listed`, default: false, initial: true },
	agencyText: { type: Types.Text, label: 'agency', dependsOn: { agencyNotListed: true }, initial: true },

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		isOutsideMassachusetts: { type: Types.Boolean, label: 'is outside Massachusetts', default: false, initial: true },
		city: { type: Types.Relationship, label: 'city', ref: 'City or Town', dependsOn: { 'address.isOutsideMassachusetts': false }, initial: true },
		cityText: { type: Types.Text, label: 'city', dependsOn: { 'address.isOutsideMassachusetts': true }, initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true, validate: Validators.zipValidator }
	},

	title: { type: Types.Text, label: 'title', initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true }

}, 'User Selections', {

	bookmarkedChildren: { type: Types.Relationship, label: 'bookmarked children', ref: 'Child', many: true, noedit: true },
	bookmarkedSiblings: { type: Types.Relationship, label: 'bookmarked sibling group children', ref: 'Child', many: true, noedit: true }

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// Set up relationship values to show up at the bottom of the model if any exist
SocialWorker.relationship( { ref: 'Child', refPath: 'adoptionWorker', path: 'childrenAdoption', label: 'adoption worker for' } );
SocialWorker.relationship( { ref: 'Child', refPath: 'recruitmentWorker', path: 'childrenRecruitment', label: 'recruitment worker for' } );
SocialWorker.relationship( { ref: 'Family', refPath: 'socialWorker', path: 'families', label: 'families' } );
SocialWorker.relationship( { ref: 'Inquiry', refPath: 'socialWorker', path: 'my-inquiries', label: 'my inquiries' } );
SocialWorker.relationship( { ref: 'Inquiry', refPath: 'childsSocialWorker', path: 'family-inquiries', label: 'family inquiries' } );
SocialWorker.relationship( { ref: 'Event', refPath: 'socialWorkerAttendees', path: 'events', label: 'events' } );
SocialWorker.relationship( { ref: 'Donation', refPath: 'socialWorker', path: 'donations', label: 'donations' } );
SocialWorker.relationship( { ref: 'Internal Note', refPath: 'socialWorker', path: 'internal-notes', label: 'internal notes' } );
SocialWorker.relationship( { ref: 'Social Worker History', refPath: 'socialWorker', path: 'social-worker-histories', label: 'change history' } );

/* TODO: VERY IMPORTANT:  Need to fix this to provide the link to access the keystone admin panel again */
/* 						  Changing names or reworking this file changed the check in node_modules/keystone/templates/views/signin.jade
/*						  for user.isAdmin on line 14 */
// Provide access to Keystone
SocialWorker.schema.virtual( 'canAccessKeystone' ).get( function() {
	'use strict';

	return false;
});

SocialWorker.schema.virtual( 'displayName' ).get( function() {
	'use strict';

	return `${ this.name.first } ${ this.name.last }`;
});

// Post Init - used to store all the values before anything is changed
SocialWorker.schema.post( 'init', function() {
	'use strict';

	this._original = this.toObject();
});

// Pre Save
SocialWorker.schema.pre( 'save', function( next ) {
	'use strict';

	// trim whitespace characters from any type.Text fields
	this.trimTextFields();
	// create a full name for the social worker
	this.setFullName();
	// all user types that can log in derive from the User model, this allows us to identify users better
	this.setUserType();
	// ensure the user's verification status is current
	this.setVerifiedStatus();

	 next();
});

SocialWorker.schema.post( 'save', function() {

	// we need this id in case the family was created via the website and updatedBy is empty
	const websiteBotFetched = UserServiceMiddleware.getUserByFullName( 'Website Bot', 'admin' );

	// if the bot user was fetched successfully
	websiteBotFetched
		.then( bot => {
			// set the updatedBy field to the bot's _id if the field isn't already set ( meaning it was saved in the admin UI and we know the user based on their session info )
			this.updatedBy = this.updatedBy || bot.get( '_id' );
		})
		// if there was an error fetching the bot user
		.catch( err => {
			// log it for debugging purposes
			console.error( `Website Bot could not be fetched for social worker ${ this.name.full }`, err );
		})
		// execute the following regardless of whether the promises were resolved or rejected
		// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
		.then( () => {
			// process change history
			this.setChangeHistory();
		});

	// check to see if the agency region tags need to be updated
	const newAgencyId = this.agency && this.agency.toString();
	const oldAgencyId = this._original 
		? this._original.agency && this._original.agency.toString() 
		: newAgencyId;
	
	// if agency has been updated...
	if ( oldAgencyId !== newAgencyId ) {
		
		// get the agency records so we can view the region data
		keystone.list( 'Agency' ).model
			.find({ _id: { $in: [ oldAgencyId, newAgencyId ] } } )
			.populate( 'address.region' )
			.exec()
			.then( agencyDocs => {

				// get the regions from the populated agency docs
				const oldAgency = agencyDocs.find( agencyDoc => agencyDoc._id.toString() == oldAgencyId );
				const newAgency = agencyDocs.find( agencyDoc => agencyDoc._id.toString() == newAgencyId );
				const oldAgencyRegion = oldAgency && oldAgency.address.region && oldAgency.address.region.region;
				const newAgencyRegion = newAgency && newAgency.address.region && newAgency.address.region.region;
				
				// configure the tag updates
				const tagUpdates = [{
					// remove the old agency region tag
					name: oldAgencyRegion,
					status: 'inactive'
				}, {
					// add the new agency region tag
					name: newAgencyRegion,
					status: 'active'
				// remove any empty tags (e.g. if old or new state are undefined)
				}].filter( tagUpdate => tagUpdate.name );

				// apply the tag updates in mailchimp
				return oldAgencyRegion != newAgencyRegion
					? MailchimpService.updateMemberTags( this.email, tagUpdates, process.env.MAILCHIMP_AUDIENCE_ID )
					: true; // if no updates are required, just return true
			})
			.then( () => console.log( `Successfully updated social worker's (${this.email}) agency region tag in mailchimp` ) )
			.catch( error => {

				// if the member simply does not exist in the list, ignore the error
				if ( error.status !== 404 ) {
					// otherwise, log the error
					console.error( `Failed to upate social worker's (${this.email}) agency region tag in mailchimp` );
					console.error( error );
				}
			});
	}
});

/* text fields don't automatically trim(), this is to ensure no leading or trailing whitespace gets saved into url, text, or text area fields */
SocialWorker.schema.methods.trimTextFields = function() {

	if( this.get( 'name.first' ) ) {
		this.set( 'name.first', this.get( 'name.first' ).trim() );
	}

	if( this.get( 'name.last' ) ) {
		this.set( 'name.last', this.get( 'name.last' ).trim() );
	}

	if( this.get( 'name.full' ) ) {
		this.set( 'name.full', this.get( 'name.full' ).trim() );
	}

	if( this.get( 'phone.work' ) ) {
		this.set( 'phone.work', this.get( 'phone.work' ).trim() );
	}

	if( this.get( 'phone.mobile' ) ) {
		this.set( 'phone.mobile', this.get( 'phone.mobile' ).trim() );
	}

	if( this.get( 'agencyText' ) ) {
		this.set( 'agencyText', this.get( 'agencyText' ).trim() );
	}

	if( this.get( 'address.street1' ) ) {
		this.set( 'address.street1', this.get( 'address.street1' ).trim() );
	}

	if( this.get( 'address.street2' ) ) {
		this.set( 'address.street2', this.get( 'address.street2' ).trim() );
	}

	if( this.get( 'address.cityText' ) ) {
		this.set( 'address.cityText', this.get( 'address.cityText' ).trim() );
	}

	if( this.get( 'address.zipCode' ) ) {
		this.set( 'address.zipCode', this.get( 'address.zipCode' ).trim() );
	}

	if( this.get( 'title' ) ) {
		this.set( 'title', this.get( 'title' ).trim() );
	}

	if( this.get( 'notes' ) ) {
		this.set( 'notes', this.get( 'notes' ).trim() );
	}
};

SocialWorker.schema.methods.setFullName = function() {
	'use strict';

	// populate the full name string for better identification when linking through Relationship field types
	this.name.full = `${ this.name.first } ${ this.name.last }`;
};
// TODO: better handled with a virtual
SocialWorker.schema.methods.setUserType = function() {
	'use strict'

	// set the userType for role based page rendering
	this.userType = 'social worker';
};

SocialWorker.schema.methods.setVerifiedStatus = function() {

	// if an admin has manually set a social worker to active, verify their email address as well
	if ( this._original && this.isActive && !this._original.isActive ) {
		this.permissions.isVerified = true;
	}
};

SocialWorker.schema.methods.setChangeHistory = function() {
	'use strict';

	return new Promise( ( resolve, reject ) => {

		const modelBefore	= this._original,
			  model			= this;

		const SocialWorkerHistory = keystone.list( 'Social Worker History' );

		const changeHistory = new SocialWorkerHistory.model({
			socialWorker	: this,
			date			: Date.now(),
			summary			: '',
			changes			: '',
			modifiedBy		: this.updatedBy
		});

		// if the model is being saved for the first time
		if( !model._original ) {
			// set the summary information for the change history record
			changeHistory.summary = 'record created';
			// set the text for the change history record
			changeHistory.changes = '<p>record created</p>';
			// save the change history record
			changeHistory.save( () => {
				// if the record saved successfully, resolve the promise
				resolve();
			// if there was an error saving the record
			}, err => {
				// log the error for debugging purposes
				console.error( `initial change history record could not be saved for social worker ${ this.name.full }`, err );
				// reject the promise
				reject();
			});
		// if the model isn't being saved for the first time
		} else {
			// Any time a new field is added, it MUST be added to this list in order to be considered for display in change history
			// Computed fields and fields internal to the object SHOULD NOT be added to this list
			async.parallel([

				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'email',
												label: 'email address',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'isActive',
												label: 'is active',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'permissions',
												name: 'isVerified',
												label: 'is verified',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'name',
												name: 'first',
												label: 'first name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'name',
												name: 'last',
												label: 'last name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'avatar',
												name: 'url',
												label: 'avatar',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'contactGroups',
												targetField: 'name',
												label: 'contact groups',
												type: 'relationship',
												model: 'Contact Group' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'phone',
												name: 'work',
												label: 'work phone number',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'phone',
												name: 'mobile',
												label: 'mobile phone number',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'phone',
												name: 'preferred',
												label: 'preferred phone',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'positions',
												targetField: 'position',
												label: 'positions',
												type: 'relationship',
												model: 'Social Worker Position' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'agency',
												targetField: 'name',
												label: 'agency',
												type: 'relationship',
												model: 'Agency' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'agencyNotListed',
												label: 'agency isnt listed',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'agencyText',
												label: 'agency (text field)',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'street1',
												label: 'street 1',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'street2',
												label: 'street 2',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'city',
												targetField: 'cityOrTown',
												label: 'city',
												type: 'relationship',
												model: 'City or Town' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'isOutsideMassachusetts',
												label: 'is outside Massachusetts',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'cityText',
												label: 'city (text field)',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'state',
												targetField: 'state',
												label: 'state',
												type: 'relationship',
												model: 'State' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'zipCode',
												label: 'zip code',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'title',
												label: 'title',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'notes',
												label: 'notes',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'bookmarkedChildren',
												targetParent: 'name',
												targetField: 'full',
												label: 'bookmarked children',
												type: 'relationship',
												model: 'Child' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'bookmarkedSiblings',
												targetParent: 'name',
												targetField: 'full',
												label: 'bookmarked sibling group children',
												type: 'relationship',
												model: 'Child' }, model, modelBefore, changeHistory, done);
				}
			], () => {
				// if there were no updates to the family record
				if ( changeHistory.changes === '' ) {
					// resolve the promise
					resolve();
				// if there were updates to the family record
				} else {
					// save the change history record
					changeHistory.save( () => {
						// if the record saved successfully, resolve the promise
						resolve();
					// if there was an error saving the record
					}, err => {
						// log the error for debugging purposes
						console.error( `change history record could not be saved for social worker ${ this.name.full }`, err );
						// reject the promise
						reject();
					});
				}
			});
		}
	});
};

// Define default columns in the admin interface and register the model
SocialWorker.defaultColumns = 'name.full, phone.mobile, phone.mobile, phone.preferred, email, isActive';
SocialWorker.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = SocialWorker;
