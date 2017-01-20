const keystone = require( 'keystone' );
const Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
let Source = new keystone.List( 'Source', {
	autokey: { path: 'key', from: 'source', unique: true },
	map: { name: 'source' }
});

// Create fields
Source.add({
	source: { type: Types.Text, label: 'source', required: true, initial: true },
	type: { type: Types.Select, options: 'event, media', label: 'source type', required: true, initial: true },
	isActive: { type: Types.Boolean, label: 'is source active', initial: true },
	mediaFrequency: { type: Types.Text, label: 'media frequency', dependsOn: { type: 'media' }, initial: true },
	mediaType: { type: Types.Relationship, ref: 'Media Type', label: 'media type', dependsOn: { type: 'media' }, initial: true }

});

Source.relationship( { ref: 'Media Feature', refPath: 'source', path: 'media-features', label: 'media features' } );

// Define default columns in the admin interface and register the model
Source.defaultColumns = 'source, type, mediaType, isActive';
Source.register();