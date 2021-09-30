const keystone = require( 'keystone' );
const Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var MatchingExclusion = new keystone.List( 'Matching Exclusion', {
	map: { name: 'matchingExclusion' }
});

// Create fields
MatchingExclusion.add({
	matchingExclusion:  { type: Types.Text, label: 'matching exclusion', required: true, initial: true },
    exclusionType:      { type: Types.Select, options: 'Family Constellation Exclusions, Other Exclusions', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
MatchingExclusion.defaultColumns = 'matchingExclusion, exclusionType';
MatchingExclusion.register();
