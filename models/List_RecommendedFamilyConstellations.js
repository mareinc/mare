var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var RecommendedFamilyConstellation = new keystone.List('Recommended Family Constellations', {
	autokey: { path: 'key', from: 'constellationType', unique: true },
	map: { name: 'constellationType' }
});

// Create fields
RecommendedFamilyConstellation.add({
	constellationType: { type: String, label: 'Constellation Type', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
RecommendedFamilyConstellation.defaultColumns = 'constellationType';
RecommendedFamilyConstellation.register();