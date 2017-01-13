var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Agency = new keystone.List('Agency', {
	track: true,
	autokey: { path: 'key', from: 'code', unique: true },
	map: { name: 'code' }
});

// Create fields
Agency.add({
	code: { type: Types.Text, label: 'agency code', required: true, initial: true },
	name: { type: Types.Text, label: 'agency name', required: true, initial: true },

	phone: { type: Types.Text, label: 'phone number', initial: true },
	fax: { type: Types.Text, label: 'fax number', initial: true },

	address: {
		street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true },
		region: { type: Types.Relationship, label: 'region', ref: 'Region', initial: true }
	},

	url: { type: Types.Text, label: 'agency url', initial: true },
	generalInquiryContact: { type: Types.Email, label: 'general inquiry contact', initial: true }

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// Set up relationship values to show up at the bottom of the model if any exist
// TODO: set up a relationship for Social Workers as agency contacts.  This doesn't seem to work as Social Worker extends User
Agency.relationship({ ref: 'Inquiry', refPath: 'agency', path: 'agency', label: 'inquries' });
Agency.relationship({ ref: 'Inquiry', refPath: 'agencyReferral', path: 'agencyReferral', label: 'agency referral inquiries' });

// Define default columns in the admin interface and register the model
Agency.defaultColumns = 'code, name, phone';
Agency.register();