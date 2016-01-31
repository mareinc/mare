var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SingleParentOption = new keystone.List('Single Parent Option', {
	autokey: { path: 'key', from: 'singleParentOption', unique: true },
	map: { name: 'singleParentOption' }
});

// Create fields
SingleParentOption.add({
	singleParentOption: { type: Types.Text, label: 'single parent option', required: true, index: true, initial: true }
});

// Define default columns in the admin interface and register the model
SingleParentOption.defaultColumns = 'singleParentOption';
SingleParentOption.register();