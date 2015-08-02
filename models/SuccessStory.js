var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SuccessStory = new keystone.List('SuccessStory', {
	track: true,
	map: { name: 'heading' }
});

// Create fields
SuccessStory.add({
	heading: { type: Types.Text, label: 'heading', required: true, initial: true, index: true },
	subHeading: { type: Types.Text, label: 'sub-heading', index: true },
	content: { type: Types.Html, wysiwyg: true }
});

// Pre Save
SuccessStory.schema.pre('save', function(next) {
	'use strict';

	next();
});

// Define default columns in the admin interface and register the model
SuccessStory.defaultColumns = 'title, url';
SuccessStory.register();