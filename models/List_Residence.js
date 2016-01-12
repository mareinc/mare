var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Residence = new keystone.List('Residence', {
	autokey: { path: 'key', from: 'residence', unique: true },
	map: { name: 'residence' }
});

// Create fields
Residence.add({
	residence: { type: Types.Text, label: 'Residence', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
Residence.defaultColumns = 'residence';
Residence.register();