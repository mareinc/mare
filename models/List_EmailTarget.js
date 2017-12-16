var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var EmailTarget = new keystone.List('Email Target', {
	map: { name: 'emailTarget' },
	nodelete: true
});

// Create fields
EmailTarget.add({
	emailTarget: { type: Types.Text, label: 'email target', note: 'a MARE employee will be matched with this as the primary email recipient', required: true, noedit: true, initial: true }
});

// Define default columns in the admin interface and register the model
EmailTarget.defaultColumns = 'emailTarget';
EmailTarget.register();