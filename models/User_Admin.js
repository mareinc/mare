/* Fields in old system, missing from the new one

initials
login_name
scp_id (security profile ID)

   Fields in new system, missing from the old one

isVerified
isActive
avatar
phone.work
phone.mobile
phone.home
address.street1
address.street2
address.city
address.state
address.zipCode

   End missing fields */

var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var User = new keystone.List('User', {
	track: true,
	map: { name: 'name.full' },
	defaultSort: 'name.full'
});

// Create fields
User.add('Permissions', {

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: false, noedit: true },
		isActive: { type: Boolean, label: 'is active', default: true, noedit: true }
	}

}, 'General Information', {

	name: {
		first: { type: Types.Text, label: 'first name', required: true, index: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, index: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	password: { type: Types.Password, label: 'password', required: true, initial: true },
	avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/admin', autoCleanup: true }

}, 'Contact Information', {

	email: { type: Types.Email, label: 'email address', unique: true, required: true, index: true, initial: true },

	phone: {
		work: { type: Types.Text, label: 'work phone number', initial: true },
		home: { type: Types.Text, label: 'home phone number', initial: true },
		cell: { type: Types.Text, label: 'cell phone number', initial: true },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, home, cell', initial: true }
	},

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', index: true, initial: true },
		zipCode: { type: Types.Text, label: 'zip code', index: true, initial: true }
	}

});

// Displaly associations via the Relationship field type
User.relationship({ path: 'cscRegionContact', ref: 'CSC Region Contact', label: 'contact for the following regions', refPath: 'cscRegionContact' });

// Pre Save
User.schema.pre('save', function(next) {
	'use strict';

	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = this.name.first + ' ' + this.name.last;

	next();
});

/* TODO: VERY IMPORTANT:  Need to fix this to provide the link to access the keystone admin panel again */
/* 						  Changing names or reworking this file changed the check in node_modules/keystone/templates/views/signin.jade
/*						  for user.isAdmin on line 14 */
// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
	'use strict';

	return true;
});

// Define default columns in the admin interface and register the model
User.defaultColumns = 'name.full, email, phone.work, isActive, isVerified';
User.register();