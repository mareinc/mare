var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var ContactMethod = new keystone.List('Contact Method', {
	autokey: { path: 'key', from: 'contactMethod', unique: true },
	map: { name: 'contactMethod' }
});

// Create fields
ContactMethod.add({
	contactMethod: { type: String, label: 'Contact Method', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
ContactMethod.defaultColumns = 'contactMethod';
ContactMethod.register();