var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SlideshowItem = new keystone.List('Slideshow Item', {
	track: true,
	map: { name: 'heading' }
});

// Create fields
SlideshowItem.add({
	image: { type: Types.CloudinaryImage, folder: 'slideshow/', autoCleanup: true },
	parent: { type: Types.Relationship, label: 'slideshow', ref: 'Slideshow', many: false, initial: true },
	heading: { type: Types.Text, label: 'heading', initial: true },
	subHeading: { type: Types.Text, label: 'sub-heading', initial: true },
	guideLabel: { type: Types.Text, label: 'label', initial: true},
	order: { type: Types.Number, label: 'order', initial: true }
});

// Pre Save
SlideshowItem.schema.pre('save', function(next) {
	'use strict';

	// TODO: Consider formatting the order to 0,0

	next();
});

// Define default columns in the admin interface and register the model
SlideshowItem.defaultColumns = 'heading, order, parent';
SlideshowItem.register();