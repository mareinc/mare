var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Page = new keystone.List('Page', {
    track: true,
    autokey: { path: 'key', from: 'title', unique: true },
    map: { name: 'title' },
    defaultSort: '-menu subMenu'
});

// Create fields
Page.add({
    title: { type: String, label: 'page title', required: true, initial: true, index: true },
    url: { type: Types.Url, noedit: true },
    content: { type: Types.Html, wysiwyg: true }
});

// Pre Save
Page.schema.pre('save', function(next) {
    this.url = '/' + this.key;
    next();
});

// Define default columns in the admin interface and register the model
Page.defaultColumns = 'title, url, menu, subMenu';
Page.register();