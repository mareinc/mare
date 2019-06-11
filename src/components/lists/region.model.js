const keystone = require('keystone');
const Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
const Region = new keystone.List( 'Region', {
	autokey: { path: 'key', from: 'Region', unique: true },
	map: { name: 'region' }
});

// Create fields
Region.add({
	region: { type: Types.Text, label: 'region', required: true, initial: true }
});

// Displaly associations via the Relationship field type
Region.relationship({ ref: 'CSC Region Contact', refPath: 'region', path: 'region', label: 'CSC contacts' });
Region.relationship({ ref: 'City or Town', refPath: 'region', path: 'region', label: 'cities and towns' });

// Define default columns in the admin interface and register the model
Region.defaultColumns = 'region';
Region.register();