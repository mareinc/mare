var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var StaffEmailTarget = new keystone.List('Staff Email Target', {
	map: { name: 'staffEmailTarget' }
});

// Create fields
StaffEmailTarget.add({
	staffEmailTarget: { type: Types.Text, label: 'staff email target', note: 'a MARE employee will be matched with this as the primary email recipient', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
StaffEmailTarget.defaultColumns = 'staffEmailTarget';
StaffEmailTarget.register();