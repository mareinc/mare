var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var OtherConsideration = new keystone.List('Other Consideration', {
	autokey: { path: 'key', from: 'otherConsideration', unique: true },
	map: { name: 'otherConsideration' }
});

// Create fields
OtherConsideration.add({
	otherConsideration: { type: Types.Text, label: 'other consideration', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
OtherConsideration.defaultColumns = 'otherConsideration';
OtherConsideration.register();