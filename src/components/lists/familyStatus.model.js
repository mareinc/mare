const keystone	= require( 'keystone' );
const Types		= keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var FamilyStatus = new keystone.List('Family Status', {
	autokey: { path: 'key', from: 'familyStatus', unique: true },
	map: { name: 'familyStatus' }
});

// Create fields
FamilyStatus.add({
	familyStatus: { type: Types.Text, label: 'family status', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
FamilyStatus.defaultColumns = 'familyStatus';
FamilyStatus.register();