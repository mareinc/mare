var keystone	= require( 'keystone' ),
	Types		= keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var CSCRegionContact = new keystone.List( 'CSC Region Contact' );

// Create fields
CSCRegionContact.add({
	region: { type: Types.Relationship, label: 'region', ref: 'Region', required: true, initial: true },
	cscRegionContact: { type: Types.Relationship, label: 'CSC region contact', ref: 'Admin', filters: { isActive: true }, required: true, initial: true }
});

// Define default columns in the admin interface and register the model
CSCRegionContact.defaultColumns = 'region, cscRegionContact';
CSCRegionContact.register();