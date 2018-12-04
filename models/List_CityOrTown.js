// TODO: see if we can remove textRegion and the check in the pre-save hook now that the migration is done

const keystone = require( 'keystone' ),
	  Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
const CityOrTown = new keystone.List('City or Town', {
	autokey: { path: 'key', from: 'cityOrTown', unique: true },
	map: { name: 'cityOrTown' },
	label: 'Cities and Towns',
	defaultSort: 'cityOrTown'
});

// Create fields
CityOrTown.add({
	cityOrTown: { type: Types.Text, label: 'city or town', required: true, initial: true },
	areaOffice: { type: Types.Text, label: 'area office', initial: true },
	region: { type: Types.Relationship, label: 'region', ref: 'Region', initial: true },
	textRegion: { type: Types.Text, label: 'region', hidden: true }
});

// Define default columns in the admin interface and register the model
CityOrTown.defaultColumns = 'cityOrTown, region, areaOffice';
CityOrTown.register();