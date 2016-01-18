var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Race = new keystone.List('Race', {
	autokey: { path: 'key', from: 'Race', unique: true },
	map: { name: 'race' }
});

// Create fields
Race.add({
	race: { type: Types.Text, label: 'race', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
Race.defaultColumns = 'race';
Race.register();