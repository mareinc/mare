var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Form = new keystone.List('Form', {
	track: true,
	autokey: { path: 'key', from: 'title', unique: true },
	map: { name: 'title' }
});

// TODO: Try to fix the date time field to either not have milliseconds, or to parse it on save for a cleaner display of default columns
// Create fields
Form.add({
	title: { type: Types.Text, label: 'form name', required: true, index: true, initial: true },
	url: { type: Types.Url, noedit: true },
	contact: { type: Types.Relationship, ref: 'User', label: 'contact person', dependsOn: { selectUnregisteredContact: false }, initial: true },
	selectUnregisteredContact: { type: Types.Boolean, label: 'contact person isn\'t registered with MARE', initial: true },
	unregisteredContact: { type: Types.Text, label: 'contact person\'s email', dependsOn: { selectUnregisteredContact: true }, initial: true },
	hasRange: { type: Types.Boolean, label: 'form valid for specific time range', initial: true },
	availableFrom: { type: Types.Text, label: 'available from', dependsOn: { selectFormRange: true }, initial: true },
	availableTo: { type: Types.Text, label: 'available to', dependsOn: { selectFormRange: true }, initial: true },
	content: { type: Types.Html, wysiwyg: true, initial: true }
});

// Pre Save
Form.schema.pre('save', function(next) {
	'use strict';

	// TODO: check if the unregistered contact email belongs to a user
	// and change the binding for registered contact

	this.url = '/form/' + this.key;
	next();
});

// Define default columns in the admin interface and register the model
Form.defaultColumns = 'title, url, contact, availableFrom, availableTo';
Form.register();