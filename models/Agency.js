var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Agency = new keystone.List('Agency', {
	track: true,
	autokey: { path: 'key', from: 'title', unique: true },
	map: { name: 'title' }
});

// Create fields
Agency.add({
	code: { type: Types.Number, label: 'Agency Code', required: true, initial: true },
	name: { type: Types.Text, label: 'Agency Name', required: true, initial: true },

	phone: { type: Types.Text, label: 'Phone Number', initial: true },
	fax: { type: Types.Text, label: 'Fax Number', initial: true },

	address: {
		street1: { type: Types.Text, label: 'Address Line 1', initial: true },
		street2: { type: Types.Text, label: 'Address Line 2', initial: true },
		city: { type: Types.Text, label: 'City', initial: true },
		state: { type: Types.Relationship, label: 'State', ref: 'State', index: true, initial: true },
		zipCode: { type: Types.Text, label: 'Zip code', index: true, initial: true }
	},

	url: { type: Types.Text, label: 'Agency URL', initial: true },
	region: { type: Types.Relationship, label: 'Region', ref: 'Region', initial: true }

});

// Define default columns in the admin interface and register the model
Agency.defaultColumns = 'code, name, phone';
Agency.register();