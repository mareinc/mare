var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var ChildPlacementConsiderations = new keystone.List('Child Placement Considerations', {
	autokey: { path: 'key', from: 'title', unique: true },
	map: { name: 'title' },
	defaultSort: 'title'
});

// Create fields
ChildPlacementConsiderations.add({
	title: { type: String, label: 'Child Placement Consideration', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
ChildPlacementConsiderations.defaultColumns = 'title';
ChildPlacementConsiderations.register();