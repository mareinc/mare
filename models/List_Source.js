var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Source = new keystone.List('Source', {
	autokey: { path: 'key', from: 'source', unique: true },
	map: { name: 'source' }
});

// Create fields
Source.add({
	source: { type: Types.Text, label: 'source', required: true, initial: true },
	isMediaOutlet: { type: Types.Boolean, label: 'media outlet', initial: true },
	isActiveMediaOutlet: { type: Types.Boolean, label: 'active media outlet', dependsOn: { isMediaOutlet: true }, initial: true },
	mediaFrequency: { type: Types.Text, label: 'media frequency', dependsOn: { isMediaOutlet: true }, initial: true },
	mediaType: { type: Types.Select, options: 'print, web, TV, radio', label: 'media type', dependsOn: { isMediaOutlet: true }, initial: true }

});

// Define default columns in the admin interface and register the model
Source.defaultColumns = 'source';
Source.register();