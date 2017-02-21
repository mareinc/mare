var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var ContactGroup = new keystone.List('Contact Group', {
	autokey: { path: 'key', from: 'name', unique: true },
	map: { name: 'name' }
});

// Create fields
ContactGroup.add({
	name: { type: Types.Text, label: 'group name', required: true, initial: true }
});

ContactGroup.relationship( { ref: 'Mailing List', refPath: 'contactGroupSubscribers', path: 'mailing-lists', label: 'mailing lists' } );
ContactGroup.relationship( { ref: 'Outside Contact', refPath: 'contactGroups', path: 'outside-contacts', label: 'outside contact members' } );
ContactGroup.relationship( { ref: 'Family', refPath: 'contactGroups', path: 'family', label: 'family members' } );
ContactGroup.relationship( { ref: 'Social Worker', refPath: 'contactGroups', path: 'social-workers', label: 'social worker members' } );

// Define default columns in the admin interface and register the model
ContactGroup.defaultColumns = 'name';
ContactGroup.register();

exports = module.exports = ContactGroup;
