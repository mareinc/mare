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
		isVerified: { type: Boolean, label: 'has a verified email address', default: false, noedit: true },
		isActive: { type: Boolean, label: 'is active', default: true, noedit: true }
	}

}, { heading: 'User Information' }, {

	name: {
		first: { type: Types.Text, label: 'first name', required: true, index: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, index: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	password: { type: Types.Password, label: 'password', required: true, initial: true },
	avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/site users', autoCleanup: true }

}, { heading: 'Contact Information' }, {

	email: { type: Types.Email, label: 'email address', unique: true, required: true, index: true, initial: true },

	phone: {
		work: { type: Types.Text, label: 'work phone number', initial: true },
		home: { type: Types.Text, label: 'home phone number', initial: true },
		cell: { type: Types.Text, label: 'cell phone number', initial: true },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, home, cell', initial: true }
	},

	address: {
	    street1: { type: Types.Text, label: 'address line 1', initial: true },
		street2: { type: Types.Text, label: 'address line 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', index: true, initial: true },
		zipCode: { type: Types.Text, label: 'zip code', index: true, initial: true }
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