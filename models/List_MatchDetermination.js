const keystone	= require( 'keystone' );
const Types		= keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var MatchDetermination = new keystone.List('Match Determination', {
	autokey: { path: 'key', from: 'determination', unique: true },
	map: { name: 'determination' }
});

// Create fields
MatchDetermination.add({
	determination: { type: Types.Text, label: 'match determination', required: true, initial: true }

});

// Define default columns in the admin interface and register the model
MatchDetermination.defaultColumns = 'determination';
MatchDetermination.register();