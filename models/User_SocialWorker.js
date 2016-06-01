var keystone	= require('keystone'),
	Types		= keystone.Field.Types,
	User		= keystone.list('User');

// Create model
var SocialWorker = new keystone.List('Social Worker', {
	inherits: User,
	track: true,
	map: { name: 'name.full' },
	defaultSort: 'name.full'
});

// Create fields
SocialWorker.add('General Information', {

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
	position: { type: Types.Select, options: 'adoption worker, recruitment worker, supervisor, administrator, family worker, other', label: 'Position', initial: true },
	agency: { type: Types.Relationship, label: 'agency', ref: 'Agency', initial: true },
	agencyNotListed: { type: Types.Boolean, label: 'agency isn\'t listed', initial: true },
	agencyText: { type: Types.Text, label: 'agency', dependsOn: { agencyNotListed: true }, initial: true },

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true },
		region: { type: Types.Relationship, label: 'region', ref: 'Region', initial: true }
	},

	title: { type: Types.Text, label: 'title', initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true }

}, 'User Selections', {

	bookmarkedChildren: { type: Types.Relationship, label: 'bookmarked children', ref: 'Child', many: true, noedit: true }

});

SocialWorker.relationship({ ref: 'Child', refPath: 'adoptionWorker', path: 'children', label: 'children' });
SocialWorker.relationship({ ref: 'Inquiry', refPath: 'socialWorker', path: 'my inquiries', label: 'my inquiries' });
SocialWorker.relationship({ ref: 'Inquiry', refPath: 'childsSocialWorker', path: 'family inquiries', label: 'family inquiries' });
SocialWorker.relationship({ ref: 'Mailing List', refPath: 'socialWorkerAttendees', path: 'mailing-lists', label: 'mailing lists' });
SocialWorker.relationship({ ref: 'Event', refPath: 'socialWorkerAttendees', path: 'events', label: 'events' });

// Pre Save
SocialWorker.schema.pre('save', function(next) {
	'use strict';

	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = this.name.first + ' ' + this.name.last;
	// Set the userType for role based page rendering
	this.userType = 'social worker';

	next();
});

/* TODO: VERY IMPORTANT:  Need to fix this to provide the link to access the keystone admin panel again */
/* 						  Changing names or reworking this file changed the check in node_modules/keystone/templates/views/signin.jade
/*						  for user.isAdmin on line 14 */
// Provide access to Keystone
SocialWorker.schema.virtual('canAccessKeystone').get(function() {
	'use strict';

	return false;
});

// Define default columns in the admin interface and register the model
SocialWorker.defaultColumns = 'name.full, phone.work, phone.home, phone.cell, phone.preferred, email, permissions.isActive';
SocialWorker.register();