var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var SiteUser = new keystone.List('Site User', {
	track: true,
	map: { name: 'name.full' },
	defaultSort: 'name.full'
});

// Create fields
SiteUser.add('Permissions', {

	permissions: {
		isVerified: { type: Boolean, label: 'Has a verified email address', default: false, noedit: true },
		isActive: { type: Boolean, label: 'Is active', default: true, noedit: true }
	}

}, { heading: 'User Information' }, {

	name: {
		first: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true },
		last: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true },
		full: { type: Types.Text, label: 'Name', hidden: true, noedit: true }
	},

	password: { type: Types.Password, label: 'Password', required: true, initial: true },
	avatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/site users', autoCleanup: true }

}, { heading: 'Contact Information' }, {

	email: { type: Types.Email, label: 'Email Address', unique: true, required: true, index: true, initial: true },

	phone: {
		work: { type: Types.Text, label: 'Work phone number', initial: true },
		home: { type: Types.Text, label: 'Home phone number', initial: true },
		cell: { type: Types.Text, label: 'Cell phone number', initial: true },
		preferred: { type: Types.Select, label: 'Preferred phone', options: 'work, home, cell', initial: true }
	},

	address: {
	    street1: { type: Types.Text, label: 'Address Line 1', initial: true },
		street2: { type: Types.Text, label: 'Address Line 2', initial: true },
		city: { type: Types.Text, label: 'City', initial: true },
		state: { type: Types.Relationship, label: 'State', ref: 'State', index: true, initial: true },
		zipCode: { type: Types.Text, label: 'Zip code', index: true, initial: true }
	}

});

// Pre Save
SiteUser.schema.pre('save', function(next) {
	'use strict';

	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = this.name.first +  ' ' + this.name.last;

	next();
});

// Define default columns in the admin interface and register the model
SiteUser.defaultColumns = 'name.full, email, isActive, isVerified';
SiteUser.register();