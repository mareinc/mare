var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SlideshowItem = new keystone.List('Slideshow Item', {
	autokey: { path: 'key', from: 'heading', unique: true },
	map: { name: 'heading' }
});

// Create fields
SlideshowItem.add({

	image: {
		type: Types.CloudinaryImage,
		folder: `${ process.env.CLOUDINARY_DIRECTORY }/slideshow/`,
		select: true,
		selectPrefix: `${ process.env.CLOUDINARY_DIRECTORY }/slideshow/`,
		autoCleanup: true,
		whenExists: 'overwrite',
		filenameAsPublicID: true
	},
	parent: { type: Types.Relationship, label: 'slideshow', ref: 'Slideshow', initial: true },
	order: { type: Types.Number, label: 'order', initial: true }

});

SlideshowItem.schema.virtual( 'hasImage' ).get( function() {
	'use strict';

	return this.image.exists;
});

// Define default columns in the admin interface and register the model
SlideshowItem.defaultColumns = 'heading, order, parent';
SlideshowItem.register();