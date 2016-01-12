var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Gender = new keystone.List('Gender', {
	autokey: { path: 'key', from: 'gender', unique: true },
	map: { name: 'gender' }
});

// Create fields
Gender.add({
	gender: { type: Types.Text, label: 'Gender', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
Gender.defaultColumns = 'gender';
Gender.register();