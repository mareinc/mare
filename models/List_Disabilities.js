var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Disabilities = new keystone.List('Disabilities', {
	autokey: { path: 'key', from: 'disability', unique: true },
	map: { name: 'disability' }
});

// Create fields
Disabilities.add({
	disability: { type: String, label: 'Disability', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
Disabilities.defaultColumns = 'disability';
Disabilities.register();