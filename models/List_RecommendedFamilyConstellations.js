var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var RecommendedFamilyConstellation = new keystone.List('Recommended Family Constellation', {
	autokey: { path: 'key', from: 'familyConstellation', unique: true },
	map: { name: 'familyConstellation' }
});

// Create fields
RecommendedFamilyConstellation.add({
	familyConstellation: { type: String, label: 'Family Constellation', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
RecommendedFamilyConstellation.defaultColumns = 'familyConstellation';
RecommendedFamilyConstellation.register();