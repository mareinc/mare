var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var LegalStatus = new keystone.List('Legal Status', {
	autokey: { path: 'key', from: 'legalStatus', unique: true },
	map: { name: 'legalStatus' }
});

// Create fields
LegalStatus.add({
	legalStatus: { type: Types.Text, label: 'Legal Status', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
LegalStatus.defaultColumns = 'legalStatus';
LegalStatus.register();