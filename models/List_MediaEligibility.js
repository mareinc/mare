var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var MediaEligibility = new keystone.List('Media Eligibility', {
	autokey: { path: 'key', from: 'mediaEligibility', unique: true },
	map: { name: 'mediaEligibility' }
});

// Create fields
MediaEligibility.add({
	mediaEligibility: { type: Types.Text, label: 'media eligibility', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
MediaEligibility.defaultColumns = 'mediaEligibility';
MediaEligibility.register();