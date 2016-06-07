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

	heading: { type: Types.Text, label: 'heading', required: true, initial: true },
	url: { type: Types.Url, label: 'url', noedit: true },
	subHeading: { type: Types.Text, label: 'sub-heading', initial: true },
	content: { type: Types.Html, wysiwyg: true, initial: true },
	image: { type: Types.CloudinaryImage, note: 'needed to display in the sidebar', folder: 'success-stories/', autoCleanup: true },
	imageScaled: {type: Types.Url, hidden: true }

});

// Pre Save
SuccessStory.schema.pre('save', function(next) {
	'use strict';

	this.imageScaled = this._.image.thumbnail(400,250,{ quality: 80 });
	this.url = '/success-stories/' + this.key;

	next();

});

// Define default columns in the admin interface and register the model
SuccessStory.defaultColumns = 'heading, url';
SuccessStory.register();