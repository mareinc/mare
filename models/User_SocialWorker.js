require( './Tracking_SocialWorkerHistory' ),
require( './List_State' );
require( './Agency' );

var keystone				= require( 'keystone' ),
	async 					= require( 'async' ),
	Types					= keystone.Field.Types,
	SocialWorkerHistory		= keystone.list( 'Social Worker History' ),
	User					= require( './User' );
	ChangeHistoryMiddleware	= require( '../routes/middleware/models_change-history' );

// Create model
var SocialWorker = new keystone.List( 'Social Worker', {
	inherits	: User,
	track		: true,
	map			: { name: 'name.full' },
	defaultSort	: 'name.full',
	hidden		: false
});

// Create fields
SocialWorker.add( 'General Information', {

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/social workers', selectPrefix: 'users/social workers', autoCleanup: true }

}, 'Contact Information', {

	email: { type: Types.Email, label: 'email address', unique: true, required: true, initial: true },

	phone: {
		work: { type: Types.Text, label: 'work phone number', initial: true },
		mobile: { type: Types.Text, label: 'mobile phone number', initial: true },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, mobile', initial: true }
	}

}, 'Social Worker Information', {

	// position: { type: Types.Relationship, label: 'Position', ref: 'Social Worker Position', initial: true },
	position: { type: Types.Select, options: 'adoption worker, recruitment worker, supervisor, administrator, family worker, other', label: 'position', initial: true },
	agency: { type: Types.Relationship, label: 'agency', ref: 'Agency', initial: true },
	agencyNotListed: { type: Types.Boolean, label: 'agency isn\'t listed', initial: true },
	agencyText: { type: Types.Text, label: 'agency', dependsOn: { agencyNotListed: true }, initial: true },

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true }
	},

	title: { type: Types.Text, label: 'title', initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true }

}, 'User Selections', {

	bookmarkedChildren: { type: Types.Relationship, label: 'bookmarked children', ref: 'Child', many: true, noedit: true },
	bookmarkedSiblingGroups: { type: Types.Relationship, label: 'bookmarked sibling group children', ref: 'Child', many: true, noedit: true }

});

// Set up relationship values to show up at the bottom of the model if any exist
SocialWorker.relationship( { ref: 'Child', refPath: 'adoptionWorker', path: 'children', label: 'children' } );
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
SocialWorker.schema.pre('save', function(next) {
	'use strict';

	var model = this;

	async.parallel([
		done => { model.setFullName(done); }, // Create a full name for the child based on their first, middle, and last names
		done => { model.setUserType(done); }, // Create an identifying name for file uploads
		done => { model.setChangeHistory(done); } // Process change history
	], () => {

		console.log( 'social worker information updated' );

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

SocialWorker.schema.methods.setFullName = function( done ) {
	'use strict';

	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = `${ this.name.first } ${ this.name.last }`;

	done();
};

SocialWorker.schema.methods.setUserType = function( done ) {
	'use strict'

	// Set the userType for role based page rendering
	this.userType = 'social worker';

	done();
};

SocialWorker.schema.methods.setChangeHistory = function setChangeHistory( done ) {
	'use strict';

	var modelBefore	= this._original,
		model		= this;

	var changeHistory = new SocialWorkerHistory.model({
		socialWorker	: this,
	    date			: Date.now(),
	    changes			: '',
	    modifiedBy		: this.updatedBy
	});

	// if the model is being saved for the first time, mark only that fact in an initial change history record
	if( !model._original ) {

		changeHistory.changes = 'record created';

		changeHistory.save( () => {
			console.log('record created change history saved successfully');
			done();
		}, err => {			
			console.log( err );
			console.log( 'error saving record created change history' );
			done();
		});

	} else {
		// Any time a new field is added, it MUST be added to this list in order to be considered for display in change history
		// Computed fields and fields internal to the object SHOULD NOT be added to this list
		async.parallel([
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
											name: 'email',
											label: 'email address',
											type: 'string' }, model, modelBefore, changeHistory, done);
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
											label: 'agency (free text)',
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
											label: 'city',
											type: 'string' }, model, modelBefore, changeHistory, done);
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
											name: 'bookmarkedSiblingGroups',
											targetParent: 'name',
											targetField: 'full',
											label: 'bookmarked sibling group children',
											type: 'relationship',
											model: 'Child' }, model, modelBefore, changeHistory, done);
			}

		], () => {

			if ( changeHistory.changes === '' ) {
				done();
			} else {
				changeHistory.save( () => {
					console.log( 'change history saved successfully' );
					done();
				}, err => {
					console.log( err );
					console.log( 'error saving change history' );
					done();
				});
			}
		});
	}
};

// Define default columns in the admin interface and register the model
SocialWorker.defaultColumns = 'name.full, phone.work, phone.home, phone.cell, phone.preferred, email, permissions.isActive';
SocialWorker.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = SocialWorker;