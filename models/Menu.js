var keystone = require('keystone'),
    _ = require('underscore'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used as a reference in dropdown menus
var Menu = new keystone.List('Menu', {
    autokey: { path: 'key', from: 'label', unique: true },
    map: { name: 'label' },
    defaultSort: '-location'
});

// Create fields
Menu.add({
    label: { type: Types.Text, label: 'menu label', required: true, initial: true, index: true },
    target: { type: Types.Relationship, label: 'target page', ref: 'Page', many: false, initial: true },
    url: { type: Types.Url, noedit: true },
    location: { type: Types.Select, label: 'menu', options: 'site menu, main menu', default: 'main menu', initial: true },
    parent: { type: Types.Relationship, ref: 'Menu', many: false, dependsOn: { menu: 'main menu' }, initial: true, filters: {location: ':location'} }
});

// Pre Save
Menu.schema.pre('save', function(next) {
    this.url = '/' + this.key;
    next();
});

// Define default columns in the admin interface and register the model
Menu.defaultColumns = 'label, url, location, parent';
Menu.register();