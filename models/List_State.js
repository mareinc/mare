var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var State = new keystone.List('State', {
	autokey: { path: 'key', from: 'state', unique: true },
	map: { name: 'state' },
	defaultSort: 'state'
});

// Create fields
State.add({
	state: { type: Types.Text, label: 'state', required: true, initial: true },
	abbreviation: { type: Types.Text, label: 'abbreviation', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
State.defaultColumns = 'state, abbreviation';
State.register();