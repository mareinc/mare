var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Source = new keystone.List('Source', {
	autokey: { path: 'key', from: 'source', unique: true },
	map: { name: 'source' }
});

// Create fields
Source.add({
	source: { type: Types.Text, label: 'source', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
Source.defaultColumns = 'source';
Source.register();