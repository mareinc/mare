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
	title: { type: Types.Text, label: 'event name', required: true, index: true, initial: true },
	url: { type: Types.Url, noedit: true },
	contact: { type: Types.Relationship, label: 'contact person', ref: 'User', initial: true},
	graphic: { type: Types.CloudinaryImage, folder: 'events/', autoCleanup : true } },

	{ heading: 'Location' }, {
		addressLine1: { type: Types.Text, label: 'Address Line 1', required: true, initial: true },
		addressLine2: { type: Types.Text, label: 'Address Line 2', initial: true },
		city: { type: Types.Text, label: 'City', required: true, initial: true },
		state: { type: Types.Text, label: 'State', required: true, initial: true },
		zip: { type: Types.Number, label: 'Zip Code', required: true, initial: true },
		country: { type: Types.Text, label: 'Country (This will be a dropdown menu)', required: true, initial: true } },
	{ heading: 'Details'}, {
		starts: { type: Types.Datetime, initial: true },
		ends: { type: Types.Datetime, initial: true },
		description: { type: Types.Html, wysiwyg: true, initial: true }
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