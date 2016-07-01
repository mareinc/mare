var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Slideshow = new keystone.List('Slideshow', {

	track: true,
	autokey: { path: 'key', from: 'title', unique: true },
	map: { name: 'title' }

});

// Create fields
Slideshow.add({
	title: { type: Types.Text, label: 'slideshow title', initial: true }
});

Slideshow.relationship({ ref: 'Slideshow Item', refPath: 'parent', path: 'slideshow-items', label: 'slide' });

// Pre Save
Slideshow.schema.pre('save', function(next) {
	'use strict';

	next();
});

// Define default columns in the admin interface and register the model
Slideshow.defaultColumns = 'title';
Slideshow.register();