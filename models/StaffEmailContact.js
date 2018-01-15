const keystone	= require('keystone'),
	  Types		= keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
const StaffEmailContact = new keystone.List( 'Staff Email Contact', {
	autokey: { path: 'key', from: 'emailTarget', unique: true }
});

// Create fields
StaffEmailContact.add({
	emailTarget: { type: Types.Relationship, label: 'primary contact for', ref: 'Email Target', required: true, initial: true },
	staffEmailContact: { type: Types.Relationship, label: 'staff email contact', ref: 'Admin', filters: { isActive: true }, required: true, initial: true }
});

// Define default columns in the admin interface and register the model
StaffEmailContact.defaultColumns = 'emailTarget, staffEmailContact';
StaffEmailContact.register();