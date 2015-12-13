var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var AdoptionParties = new keystone.List('Adoption Parties', {
	autokey: { path: 'key', from: 'title', unique: true },
	map: { name: 'title' }
});

// Create fields
AdoptionParties.add({
	title: { type: String, label: 'Adoption Party Title', required: true, index: true, initial: true },
	date: { type: Types.Date, label: 'Event Date', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
AdoptionParties.defaultColumns = 'title, date';
AdoptionParties.register();