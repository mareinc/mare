var keystone = require('keystone'),
    Types = keystone.Field.Types;

/**
 * Menu Model
 * ==========
 */

var Menu = new keystone.List('Menu', {
    autokey: { path: 'slug', from: 'label', unique: true },
    map: { name: 'label' },
    defaultSort: '-location'
});

Menu.add({
    label: { type: Types.Text, required: true, initial: true, index: true },
    url: { type: Types.Url, required: true, initial: true, index: true },
    location: { type: Types.Select, options: 'site menu, main menu', default: 'main menu', initial: true },
    parent: { type: Types.Relationship, ref: 'Menu', many: false, initial: true, filters: {location: ':location'} }
});

/**
 * Registration
 */

Menu.defaultColumns = 'label, url, location, parent';
Menu.register();
