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
	image: { type: Types.CloudinaryImage, note: 'needed to display in the sidebar and under other success stories', folder: 'success-stories/', publicID: 'fileName', autoCleanup: true },
	imageScaled: {type: Types.Url, hidden: true }

/* Container for all system fields (add a heading if any are meant to be visible through the admin UI) */
}, {

	// system field to store an appropriate file prefix
	fileName: { type: Types.Text, hidden: true }

});

// Pre Save
SuccessStory.schema.pre('save', function(next) {
	'use strict';

	this.imageScaled = this._.image.thumbnail(168,168,{ quality: 80 });
	this.url = '/success-stories/' + this.key;

	// Create an identifying name for file uploads
	this.fileName = this.key.replace(/-/g, '_');

	next();

});

// Define default columns in the admin interface and register the model
SuccessStory.defaultColumns = 'heading, url';
SuccessStory.register();