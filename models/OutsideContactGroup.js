var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var OutsideContactGroup = new keystone.List('Outside Contact Group', {
	autokey: { path: 'key', from: 'name', unique: true },
	map: { name: 'name' }
});

// Create fields
OutsideContactGroup.add({
	name: { type: Types.Text, label: 'group name', required: true, initial: true }
});

OutsideContactGroup.relationship({ ref: 'Mailing List', refPath: 'outsideContactGroupSubscribers', path: 'mailing-lists', label: 'mailing lists' });
OutsideContactGroup.relationship({ ref: 'Outside Contact', refPath: 'groups', path: 'outside-contacts', label: 'outside contact members' });

// Define default columns in the admin interface and register the model
OutsideContactGroup.defaultColumns = 'name';
OutsideContactGroup.register();

exports = module.exports = OutsideContactGroup;
