var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var CSCEmailTarget = new keystone.List('Email Target', {
	map: { name: 'cscEmailTarget' }
});

// Create fields
CSCEmailTarget.add({
	cscEmailTarget: { type: Types.Text, label: 'email target', note: 'a MARE employee will be matched with this as the primary email recipient', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
CSCEmailTarget.defaultColumns = 'cscEmailTarget';
CSCEmailTarget.register();