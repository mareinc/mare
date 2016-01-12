var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var State = new keystone.List('State', {
	autokey: { path: 'key', from: 'state', unique: true },
	map: { name: 'state' }
});

// Create fields
State.add({
	state: { type: Types.Text, label: 'State', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
State.defaultColumns = 'state';
State.register();