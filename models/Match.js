const keystone	= require( 'keystone' );
const Types		= keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Match = new keystone.List( 'Match' );

// Create fields
Match.add( 'Match', {

	matchDate: { type: Types.Date, label: 'match date', format: 'MM/DD/YYYY', required: true, initial: true },
	child: { type: Types.Relationship, label: 'child', ref: 'Child', required: true, initial: true },
	family: { type: Types.Relationship, label: 'family', ref: 'Family', required: true, initial: true },
	determination: { type: Types.Relationship, label: 'determination', ref: 'Match Determination', required: true, initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true }

});

// Define default columns in the admin interface and register the model
Match.defaultColumns = 'matchDate, child, family, determination';
Match.register();