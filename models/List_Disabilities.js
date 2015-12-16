var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Disability = new keystone.List('Disability', {
	autokey: { path: 'key', from: 'disability', unique: true },
	map: { name: 'disability' }
});

// Create fields
Disability.add({
	disability: { type: String, label: 'Disability', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
Disability.defaultColumns = 'disability';
Disability.register();