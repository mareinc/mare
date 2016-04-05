var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var CSCEmailContact = new keystone.List('CSC Email Contact');

// Create fields
CSCEmailContact.add({
	cscEmailContact: { type: Types.Relationship, label: 'MARE email contact', ref: 'Admin', required: true, initial: true },
	emailTarget: { type: Types.Relationship, label: 'primary contact for', ref: 'Email Target', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
CSCEmailContact.defaultColumns = 'cscEmailContact, emailTarget';
CSCEmailContact.register();