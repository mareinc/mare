var keystone = require('keystone'),
    _ = require('underscore'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Page = new keystone.List('Page', {
    track: true,
    autokey: { path: 'key', from: 'title', unique: true },
    map: { name: 'title' }
});

// Create fields
Page.add({
    title: { type: String, label: 'page title', required: true, initial: true, index: true },
    url: { type: Types.Url, noedit: true },
    isMenuElement: { type: Types.Boolean, label: 'appears in a menu', initial: true, index: true },
    menu: { type: Types.Select, label: 'menu', options: 'site menu, main menu', dependsOn: { isMenuElement: true }, initial: true },
    subMenu: { type: Types.Relationship, label: 'sub menu', ref: 'Page', many: false, dependsOn: { menu: 'main menu' }, filters: { menu: ':menu' }, initial: true },
    content: { type: Types.Html, wysiwyg: true, initial: true }
});

// Pre Save
// ------------------------------
Page.schema.pre('save', function(next) {
    this.url = '/' + this.key;
    next();
});

// Define default columns in the admin interface and register the model
Page.defaultColumns = 'title, url, isMenuElement, menu, subMenu';
Page.register();