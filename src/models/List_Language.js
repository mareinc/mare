var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Language = new keystone.List('Language', {
	autokey: { path: 'key', from: 'language', unique: true },
	map: { name: 'language' }
});

// Create fields
Language.add({
	language: { type: Types.Text, label: 'language', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
Language.defaultColumns = 'language';
Language.register();