var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var CommunicationMethod = new keystone.List('Communication Method', {
	autokey: { path: 'key', from: 'communicationMethod', unique: true },
	map: { name: 'communicationMethod' }
});

// Create fields
CommunicationMethod.add({
	communicationMethod: { type: Types.Text, label: 'communication method', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
CommunicationMethod.defaultColumns = 'communicationMethod';
CommunicationMethod.register();