var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var WayToHearAboutMARE = new keystone.List('Way To Hear About MARE', {
	autokey: { path: 'key', from: 'wayToHearAboutMARE', unique: true },
	map: { name: 'wayToHearAboutMARE' },
	label: 'Ways to Hear About MARE'
});

// Create fields
WayToHearAboutMARE.add({
	wayToHearAboutMARE: { type: Types.Text, label: 'way to hear about MARE', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
WayToHearAboutMARE.defaultColumns = 'wayToHearAboutMARE';
WayToHearAboutMARE.register();