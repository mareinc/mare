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
		isVerified: { type: Boolean, label: 'Has a verified email address', default: false, noedit: true },
		isActive: { type: Boolean, label: 'Is active', default: true, noedit: true }
	}

}, 'General Information', {
	
	name: {
		first: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true },
		last: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true },
		full: { type: Types.Text, label: 'Name', hidden: true }
	},

	password: { type: Types.Password, label: 'Password', required: true, initial: true },
	avatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/admin', autoCleanup: true }

}, 'Contact Information', {

	email: { type: Types.Email, label: 'Email Address', unique: true, required: true, index: true, initial: true },

	phone: {
		work: { type: Types.Text, label: 'Work phone number', initial: true },
		workExtension: { type: Types.Text, label: 'Extension', initial: true },
		mobile: { type: Types.Text, label: 'Mobile phone number', initial: true },
		home: { type: Types.Text, label: 'Home phone number', initial: true }
    },

    address: {
	    address1: { type: Types.Text, label: 'Street', initial: true },
		address2: { type: Types.Text, label: '', initial: true },
		city: { type: Types.Text, label: 'City', initial: true },
		state: { type: Types.Select, options: 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming', label: 'State', index: true, initial: true },
		zipCode: { type: Types.Text, label: 'Zip code', index: true, initial: true }
	}

});

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
User.defaultColumns = 'name.full, email, workPhoneExtension, isActive, isVerified';
User.register();