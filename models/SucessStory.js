var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SuccessStory = new keystone.List('SuccessStory', {
    track: true,
    autokey: { path: 'key', from: 'title', unique: true },
    map: { name: 'title' }
});

// Create fields
SuccessStory.add({
    title: { type: String, label: 'page title', required: true, initial: true, index: true },
    url: { type: Types.Url, noedit: true },
    content: { type: Types.Html, wysiwyg: true }
});

// Pre Save
SuccessStory.schema.pre('save', function(next) {
	'use strict';

    this.url = '/success-story/' + this.key;
    next();
});

// Define default columns in the admin interface and register the model
SuccessStory.defaultColumns = 'title, url';
SuccessStory.register();