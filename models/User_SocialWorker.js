var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var SocialWorker = new keystone.List('Social Worker', {
	track: true,
	map: { name: 'name.full' },
	defaultSort: 'name.full'
});

// Create fields
SocialWorker.add('Permissions', {

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
	// avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/social workers', select: true, selectPrefix: 'users/social workers', autoCleanup: true }
	avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/social workers', autoCleanup: true }

}, 'Contact Information', {

	email: { type: Types.Email, label: 'email address', unique: true, required: true, index: true, initial: true },

	phone: {
		work: { type: Types.Text, label: 'work phone number', initial: true },
		cell: { type: Types.Text, label: 'cell phone number', initial: true },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, cell', initial: true }
	}

}, 'Social Worker Information', {

	// position: { type: Types.Relationship, label: 'Position', ref: 'Social Worker Position', initial: true },
	position: { type: Types.Select, options: 'adoption worker, recruitment worker, supervisor, administrator, family worker, other', label: 'Position', initial: true },
	agency: { type: Types.Relationship, label: 'agency', ref: 'Agency', initial: true },

	address: {
	    street1: { type: Types.Text, label: 'address line 1', initial: true },
		street2: { type: Types.Text, label: 'address line 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', index: true, initial: true },
		zipCode: { type: Types.Text, label: 'zip code', index: true, initial: true },
		region: { type: Types.Relationship, label: 'region', ref: 'Region', initial: true }
	},

	title: { type: Types.Text, label: 'title', index: true, initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true }

});

SocialWorker.relationship({ path: 'children', ref: 'Child', refPath: 'adoptionWorker' });
SocialWorker.relationship({ path: 'inquiries', ref: 'Inquiry', refPath: 'socialWorker' });

// Pre Save
SocialWorker.schema.pre('save', function(next) {
	'use strict';

	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = this.name.first + ' ' + this.name.last;

	next();
});

// Define default columns in the admin interface and register the model
SocialWorker.defaultColumns = 'name.full, phone.work, phone.home, phone.cell, phone.preferred, email';
SocialWorker.register();