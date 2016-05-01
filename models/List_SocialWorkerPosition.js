var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SocialWorkerPosition = new keystone.List('Social Worker Position', {
	autokey: { path: 'key', from: 'position', unique: true },
	map: { name: 'position' }
});

// Create fields
SocialWorkerPosition.add({
	position: { type: Types.Text, label: 'position', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
SocialWorkerPosition.defaultColumns = 'position';
SocialWorkerPosition.register();