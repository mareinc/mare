var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var CityOrTown = new keystone.List('City or Town', {
	autokey: { path: 'key', from: 'cityOrTown', unique: true },
	map: { name: 'cityOrTown' }
});

// Create fields
CityOrTown.add({
	cityOrTown: { type: Types.Text, label: 'city or town', required: true, initial: true },
	areaOffice: { type: Types.Text, label: 'area office', initial: true },
	region: { type: Types.Text, label: 'region', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
CityOrTown.defaultColumns = 'cityOrTown';
CityOrTown.register();