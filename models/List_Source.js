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

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

Source.relationship( { ref: 'Event', refPath: 'source', path: 'events', label: 'source for this event' } );
Source.relationship( { ref: 'Media Feature', refPath: 'source', path: 'media-features', label: 'media features' } );

// Define default columns in the admin interface and register the model
Source.defaultColumns = 'source, type, mediaType, isActive';
Source.register();