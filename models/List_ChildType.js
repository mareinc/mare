var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var ChildType = new keystone.List('Child Type', {
	autokey: { path: 'key', from: 'childType', unique: true },
	map: { name: 'childType' }
});

// Create fields
ChildType.add({
	childType: { type: Types.Text, label: 'child type', required: true, initial: true },
	availableOnWebsite: { type: Types.Boolean, label: 'available on website', initial: true },
	displayName: { type: Types.Text, label: 'display name', dependsOn: { availableOnWebsite: true }, initial: true }
});

// Define default columns in the admin interface and register the model
ChildType.defaultColumns = 'childType';
ChildType.register();