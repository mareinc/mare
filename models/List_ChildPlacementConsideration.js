var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var ChildPlacementConsideration = new keystone.List('Child Placement Consideration', {
	autokey: { path: 'key', from: 'childPlacementConsideration', unique: true },
	map: { name: 'childPlacementConsideration' }
});

// Create fields
ChildPlacementConsideration.add({
	childPlacementConsideration: { type: Types.Text, label: 'Child Placement Consideration', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
ChildPlacementConsideration.defaultColumns = 'childPlacementConsideration';
ChildPlacementConsideration.register();