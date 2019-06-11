var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var InquiryMethod = new keystone.List('Inquiry Method', {
	autokey: { path: 'key', from: 'inquiryMethod', unique: true },
	map: { name: 'inquiryMethod' }
});

// Create fields
InquiryMethod.add({
	inquiryMethod: { type: Types.Text, label: 'inquiry method', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
InquiryMethod.defaultColumns = 'inquiryMethod';
InquiryMethod.register();