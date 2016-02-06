var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var CSCRegionContact = new keystone.List('CSC Region Contact');

// Create fields
CSCRegionContact.add({

	cscRegionContact: { type: Types.Relationship, label: 'Employee', ref: 'User', required: true, initial: true },
	region: { type: Types.Relationship, label: 'Region', ref: 'Region', required: true, initial: true }

});

// Define default columns in the admin interface and register the model
CSCRegionContact.defaultColumns = 'cscRegionContact, region';
CSCRegionContact.register();