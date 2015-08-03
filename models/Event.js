var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Event = new keystone.List('Event', {
	track: true,
	autokey: { path: 'key', from: 'title', unique: true },
	map: { name: 'title' }
});

// Create fields
Event.add({
	title: { type: Types.Text, label: 'event name', required: true, initial: true, index: true },
	url: { type: Types.Url, noedit: true } },

	{ heading: 'Location' }, {
		addressLine1: { type: Types.Text, label: 'Address Line 1', required: true, initial: false },
		addressLine2: { type: Types.Text, label: 'Address Line 2', initial: false },
		city: { type: Types.Text, label: 'City', required: true, initial: false },
		state: { type: Types.Text, label: 'State', required: true, initial: false },
		zip: { type: Types.Number, label: 'Zip Code', required: true, initial: false },
		country: { type: Types.Text, label: 'Country (This will be a dropdown menu)', required: true, initial: false } },
	{ heading: 'Details'}, {
		starts: { type: Types.Datetime, initial: true },
		ends: { type: Types.Datetime, initial: true },
		description: { type: Types.Html, wysiwyg: true, initial: true },
		graphic: { type: Types.CloudinaryImage, folder: 'events/', autoCleanup : true },
		contact: { type: Types.Relationship, label: 'contact person', ref: 'User'}
});

// Pre Save
Event.schema.pre('save', function(next) {
	'use strict';

	this.url = '/events/' + this.key;
	next();
});

// Define default columns in the admin interface and register the model
Event.defaultColumns = 'title, url, starts, ends';
Event.register();