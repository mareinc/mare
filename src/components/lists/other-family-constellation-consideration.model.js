var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var OtherFamilyConstellationConsideration = new keystone.List('Other Family Constellation Consideration', {
	autokey: { path: 'key', from: 'otherFamilyConstellationConsideration', unique: true },
	map: { name: 'otherFamilyConstellationConsideration' }
});

// Create fields
OtherFamilyConstellationConsideration.add({
	otherFamilyConstellationConsideration: { type: Types.Text, label: 'other family constellation consideration', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
OtherFamilyConstellationConsideration.defaultColumns = 'otherFamilyConstellationConsideration';
OtherFamilyConstellationConsideration.register();