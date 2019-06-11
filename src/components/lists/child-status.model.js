var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var ChildStatus = new keystone.List('Child Status', {
	autokey: { path: 'key', from: 'childStatus', unique: true },
	map: { name: 'childStatus' }
});

// Create fields
ChildStatus.add({
	childStatus: { type: Types.Text, label: 'child status', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
ChildStatus.defaultColumns = 'childStatus';
ChildStatus.register();