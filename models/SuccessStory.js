var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SuccessStory = new keystone.List('Success Story', {
	track: true,
	autokey: { path: 'key', from: 'heading', unique: true },
	map: { name: 'heading' }
});

// Create fields
SuccessStory.add({
	heading: { type: Types.Text, label: 'heading', required: true, index: true, initial: true },
	subHeading: { type: Types.Text, label: 'sub-heading', initial: true },
	content: { type: Types.Html, wysiwyg: true, initial: true }
});

// Pre Save
SuccessStory.schema.pre('save', function(next) {
	'use strict';

	next();
});

// Define default columns in the admin interface and register the model
SuccessStory.defaultColumns = 'heading';
SuccessStory.register();