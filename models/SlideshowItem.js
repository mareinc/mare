var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SlideshowItem = new keystone.List('Slideshow Item', {
	track: true,
	autokey: { path: 'key', from: 'heading', unique: true },
	map: { name: 'heading' }
});

// Create fields
SlideshowItem.add({
	image: { type: Types.CloudinaryImage, folder: 'slideshow/', autoCleanup: true },
	imageStretched: {type: Types.Url, hidden: true},
	imageScaled: {type: Types.Url, hidden: true},
	parent: { type: Types.Relationship, label: 'slideshow', ref: 'Slideshow', many: false, initial: true },
	heading: { type: Types.Text, label: 'heading', initial: true },
	subHeading: { type: Types.Text, label: 'sub-heading', initial: true },
	guideLabel: { type: Types.Text, label: 'label', initial: true},
	order: { type: Types.Number, label: 'order', initial: true }
});

// Pre Save
SlideshowItem.schema.pre('save', function(next) {
	'use strict';

	this.imageStretched = this._.image.scale(1100,400,{ quality: 40 });
	this.imageScaled = this._.image.thumbnail(1100,400,{ quality: 40 });
	// TODO: Consider formatting the order to 0,0

	next();
});

// Define default columns in the admin interface and register the model
SlideshowItem.defaultColumns = 'heading, order, parent';
SlideshowItem.register();