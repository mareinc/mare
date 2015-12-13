var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var MediaEligibility = new keystone.List('Media Eligibility', {
	autokey: { path: 'key', from: 'MediaEligibility', unique: true },
	map: { name: 'MediaEligibility' }
});

// Create fields
MediaEligibility.add({
	MediaEligibility: { type: String, label: 'Media Eligibility', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
MediaEligibility.defaultColumns = 'MediaEligibility';
MediaEligibility.register();