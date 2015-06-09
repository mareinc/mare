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
    isMenuElement: { type: Types.Boolean, label: 'appears in a menu' },
    displayNameNeeded: { type: Types.Boolean, label: 'display name differs from page title', dependsOn: { isMenuElement: true } },
    displayName: { type: String, label: 'display name', initial: true, initial: true, dependsOn: { isMenuElement: true, displayNameNeeded: true } },
    menu: { type: Types.Relationship, label: 'menu', ref: 'Menu', dependsOn: { isMenuElement: true } },
    subMenu: { type: Types.Relationship, label: 'sub menu', ref: 'Page', many: false, dependsOn: { isMenuElement: true }, filters: { menu: ':menu' } },
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