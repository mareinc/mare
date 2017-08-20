var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var CityOrTown = new keystone.List('City or Town', {
	autokey: { path: 'key', from: 'cityOrTown', unique: true },
	map: { name: 'cityOrTown' },
	defaultSort: 'cityOrTown'
});

// Create fields
CityOrTown.add({
	cityOrTown: { type: Types.Text, label: 'city or town', required: true, initial: true },
	areaOffice: { type: Types.Text, label: 'area office', initial: true },
	region: { type: Types.Relationship, label: 'region', ref: 'Region', initial: true },
	textRegion: { type: Types.Text, label: 'region', hidden: true }
});

CityOrTown.schema.pre('save', function( next ) {
	'use strict';

	keystone.list( 'Region').model.find()
		.exec()
		.then( regions => {

			let regionsMap = {};

			for( let region of regions ) {
				regionsMap[ region.get( 'region' ) ] = region.get( '_id' );
			}

			if( this.textRegion ) {
				this.region = regionsMap[ this.textRegion ];
			}

			next();
		});
});

// Define default columns in the admin interface and register the model
CityOrTown.defaultColumns = 'cityOrTown, region, areaOffice';
CityOrTown.register();