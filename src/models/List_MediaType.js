const keystone = require( 'keystone' );
const Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var MediaType = new keystone.List('Media Type', {
	autokey: { path: 'key', from: 'mediaType', unique: true },
	map: { name: 'mediaType' }
});

// Create fields
MediaType.add({
	mediaType: { type: Types.Text, label: 'media type', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
MediaType.defaultColumns = 'mediaType';
MediaType.register();