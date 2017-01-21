const keystone	= require( 'keystone' );
const Types		= keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var MediaFeature = new keystone.List( 'Media Feature', {
	defaultSort: '-date'
});

// Create fields
MediaFeature.add( 'Media Feature', {

	source: { type: Types.Relationship, label: 'source', ref: 'Source', filters: { isActive: true }, required: true, initial: true },
	date: { type: Types.Date, label: 'date', format: 'MM/DD/YYYY', required: true, initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true },
	children: { type: Types.Relationship, label: 'children', ref: 'Child', many: true, initial: true }

});

// Define default columns in the admin interface and register the model
MediaFeature.defaultColumns = 'child, source, date, notes';
MediaFeature.register();