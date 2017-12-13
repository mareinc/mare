require( './Tracking_SocialWorkerHistory' );

var keystone				= require( 'keystone' ),
	async 					= require( 'async' ),
	Types					= keystone.Field.Types,
	User					= require( './User' ),
	ChangeHistoryMiddleware	= require( '../routes/middleware/models_change-history' ),
	UserServiceMiddleware	= require( '../routes/middleware/service_user' );

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list that comes later when sorting alphabetically
const ContactGroup = require( './ContactGroup' );

// Create model
var SocialWorker = new keystone.List( 'Social Worker', {
	inherits	: User,
	track		: true,
	map			: { name: 'name.full' },
	defaultSort	: 'name.full',
	hidden		: false
});

// Create fields
SocialWorker.add( 'Permissions', {

	isActive: { type: Boolean, label: 'is active', default: false },

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: false, noedit: true }
	}

}, 'General Information', {

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/social workers', select: true, selectPrefix: 'users/social workers', autoCleanup: true }, // TODO: add publicID attribute for better naming in Cloudinary

	contactGroups: { type: Types.Relationship, label: 'contact groups', ref: 'Contact Group', many: true, initial: true }

}, 'Contact Information', {

	phone: {
		work: { type: Types.Text, label: 'work phone number', initial: true },
		mobile: { type: Types.Text, label: 'mobile phone number', initial: true },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, mobile', initial: true }
	}

}, 'Social Worker Information', {

	// position: { type: Types.Relationship, label: 'Position', ref: 'Social Worker Position', initial: true },
	position: { type: Types.Select, options: 'adoption worker, recruitment worker, supervisor, administrator, family worker, other', label: 'position', initial: true },
	agency: { type: Types.Relationship, label: 'agency', ref: 'Agency', filters: { isActive: true }, initial: true },
	agencyNotListed: { type: Types.Boolean, label: 'agency isn\'t listed', initial: true },
	agencyText: { type: Types.Text, label: 'agency', dependsOn: { agencyNotListed: true }, initial: true },

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		isOutsideMassachusetts: { type: Types.Boolean, label: 'is outside Massachusetts', initial: true },
		city: { type: Types.Relationship, label: 'city', ref: 'City or Town', dependsOn: { 'address.isOutsideMassachusetts': false }, initial: true },
		cityText: { type: Types.Text, label: 'city', dependsOn: { 'address.isOutsideMassachusetts': true }, initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true }
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
SocialWorker.relationship( { ref: 'Child', refPath: 'adoptionWorker', path: 'children', label: 'children' } );
SocialWorker.relationship( { ref: 'Family', refPath: 'socialWorker', path: 'families', label: 'families' } );
SocialWorker.relationship( { ref: 'Inquiry', refPath: 'socialWorker', path: 'my-inquiries', label: 'my inquiries' } );
SocialWorker.relationship( { ref: 'Inquiry', refPath: 'childsSocialWorker', path: 'family-inquiries', label: 'family inquiries' } );
SocialWorker.relationship( { ref: 'Mailing List', refPath: 'socialWorkerSubscribers', path: 'mailing-lists', label: 'mailing lists' } );
SocialWorker.relationship( { ref: 'Event', refPath: 'socialWorkerAttendees', path: 'events', label: 'events' } );
SocialWorker.relationship( { ref: 'Internal Note', refPath: 'socialWorker', path: 'internal-notes', label: 'internal notes' } );
SocialWorker.relationship( { ref: 'Social Worker History', refPath: 'socialWorker', path: 'social-worker-histories', label: 'change history' } );

// Post Init - used to store all the values before anything is changed
SocialWorker.schema.post( 'init', function() {
	'use strict';

	this._original = this.toObject();
});

// Pre Save
SocialWorker.schema.pre( 'save', function( next ) {
	'use strict';

	// create a full name for the social worker
	this.setFullName();
	// all user types that can log in derive from the User model, this allows us to identify users better
	this.setUserType();
	// we need this id in case the family was created via the website and updatedBy is empty
	const migrationBotFetched = UserServiceMiddleware.getUserByFullName( 'Migration Bot', 'admin' );
	
	// if the bot user was fetched successfully
	migrationBotFetched
		.then( bot => {
			// set the updatedBy field to the bot's _id if the field isn't already set ( meaning it was saved in the admin UI and we know the user based on their session info )
			this.updatedBy = this.updatedBy || bot.get( '_id' );
		})
		// if there was an error fetching the bot user
		.catch( err => {
			// log it for debugging purposes
			console.error( `Migration Bot could not be fetched for social worker ${ this.name.full } - ${ err }` );
			// add a generic error to keep it in line with error reporting when saving of other user models
			console.error( `social worker ${ this.name.full } saved with errors` );
		})
		// execute the following regardless of whether the promises were resolved or rejected
		// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
		.then( () => {
			// process change history
			// TODO: if change history isn't showing up until the page is reloaded, the next() will need to wait until after setChangeHistory completes
			this.setChangeHistory();

			next();
		});
});

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

SocialWorker.schema.methods.setChangeHistory = function setChangeHistory() {
	'use strict';

	return new Promise( ( resolve, reject ) => {

		const modelBefore	= this._original,
			  model			= this;

		const SocialWorkerHistory = keystone.list( 'Social Worker History' );

		const changeHistory = new SocialWorkerHistory.model({
			socialWorker	: this,
			date			: Date.now(),
			changes			: '',
			modifiedBy		: this.updatedBy
		});

		// if the model is being saved for the first time
		if( !model._original ) {
			// set the text for the change history record
			changeHistory.changes = 'record migrated';
			// save the change history record
			changeHistory.save( () => {
				// if the record saved successfully, resolve the promise
				resolve();
			// if there was an error saving the record
			}, err => {
				// log the error for debugging purposes
				console.error( `initial change history record could not be saved for social worker ${ this.name.full } - ${ err }` );
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
												name: 'secure_url',
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
												name: 'position',
												label: 'position',
												type: 'string' }, model, modelBefore, changeHistory, done);
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
						console.error( `initial change history record could not be saved for social worker ${ this.name.full } - ${ err }` );
						// reject the promise
						reject();
					});
				}
			});
		}
	});
};

// Define default columns in the admin interface and register the model
SocialWorker.defaultColumns = 'name.full, phone.work, phone.home, phone.cell, phone.preferred, email, isActive';
SocialWorker.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = SocialWorker;