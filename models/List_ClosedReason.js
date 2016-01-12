var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var ClosedReason = new keystone.List('Closed Reason', {
	autokey: { path: 'key', from: 'reason', unique: true },
	map: { name: 'reason' }
});

// Create fields
ClosedReason.add({
	reason: { type: Types.Text, label: 'Closed Reason', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
ClosedReason.defaultColumns = 'reason';
ClosedReason.register();