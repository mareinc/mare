var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var StaffEmailContact = new keystone.List('Staff Email Contact');

// Create fields
StaffEmailContact.add({
	staffEmailContact: { type: Types.Relationship, label: 'staff email contact', ref: 'Admin', filters: { isActive: true }, required: true, initial: true },
	emailTarget: { type: Types.Relationship, label: 'primary contact for', ref: 'Staff Email Target', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
StaffEmailContact.defaultColumns = 'staffEmailContact, emailTarget';
StaffEmailContact.register();