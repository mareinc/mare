const keystone = require('keystone');
const Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
const Pronoun = new keystone.List( 'Pronoun', {
    autokey: { path: 'key', from: 'pronoun', unique: true },
	map: { name: 'pronoun' }   
});

// Create fields
Pronoun.add({
	pronoun:    { type: Types.Text, label: 'pronoun', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
Pronoun.defaultColumns = 'pronoun';
Pronoun.register();