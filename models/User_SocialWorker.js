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
		isVerified: { type: Boolean, label: 'Has a verified email address', default: false, noedit: true },
		isActive: { type: Boolean, label: 'Is active', default: true, noedit: true }
	}

}, 'General Information', {

	name: {
		first: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true },
		last: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true },
		full: { type: Types.Text, label: 'Name', hidden: true, noedit: true }
	},

	password: { type: Types.Password, label: 'Password', required: true, initial: true },
	avatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/social workers', select: true, autoCleanup: true }

}, 'Contact Information', {

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

}, 'Social Worker Information', {

	// position: { type: Types.Relationship, label: 'Position', ref: 'Social Worker Position', initial: true },
	position: { type: Types.Select, options: 'adoption worker, recruitment worker, supervisor, administrator, family worker, other', label: 'Position', initial: true },
	agency: { type: Types.Relationship, label: 'Agency', ref: 'Agency', initial: true },
	title: { type: Types.Text, label: 'Title', index: true, initial: true }

});

SocialWorker.relationship({ path: 'children', ref: 'Child', refPath: 'adoptionWorker' });

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