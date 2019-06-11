var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var InquiryType = new keystone.List('Inquiry Type', {
	autokey: { path: 'key', from: 'inquiryType', unique: true },
	map: { name: 'inquiryType' }
});

// Create fields
InquiryType.add({
	inquiryType: { type: Types.Text, label: 'inquiry type', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
InquiryType.defaultColumns = 'inquiryType';
InquiryType.register();