// TODO: You've got the isVolunteer action happening pre-save and the contact group addition happening post-save.  Can we consolidate?
var keystone			= require('keystone'),
	Types				= keystone.Field.Types,
	async				= require('async'),
	// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
	// that comes later when sorting alphabetically
	OutsideContactGroup = require('./OutsideContactGroup');

// Create model
var OutsideContact = new keystone.List('Outside Contact', {
	autokey: { path: 'key', from: 'slug', unique: true },
	map: { name: 'name' },
	defaultSort: 'name'
});

// Create fields
OutsideContact.add( 'General Information', {

	name: { type: Types.Text, label: 'name', required: true, initial: true },

	organization: { type: Types.Text, label: 'organization', initial: true },

	groups: { type: Types.Relationship, label: 'groups', ref: 'Outside Contact Group', many: true, required: true, initial: true }

}, 'Contact Information', {

	email: { type: Types.Email, label: 'email address', unique: true, initial: true },

	phone: {
		work: { type: Types.Text, label: 'work phone number', initial: true },
		mobile: { type: Types.Text, label: 'mobile phone number', initial: true },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, mobile', initial: true }
	}

}, 'Address', {

	address: {
		street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true }
	}

}, {

	isVolunteer: { type: Types.Boolean, hidden: true, noedit: true }

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// Pre Save
OutsideContact.schema.pre( 'save', function( next ) {
	'use strict';

	var model			= this,
		contactGroups	= this.groups;

	// Reset the isVolunteer flag to allow a fresh check every save
	this.isVolunteer = false;

	// Loop through each of the outside contact groups the user should be added to and mark the outside contact as a volunteer
	// if they are part of the 'volunteers' outside contact group
	async.each( contactGroups, ( listID, callback ) => {

		OutsideContactGroup.model.findById( listID )
				.exec()
				.then( result => {
					// Events have outside contacts who are volunteers listed, we need to capture a reference to which outside contacts are volunteers
					if( result.name === 'volunteers' ) {
						this.isVolunteer = true;
					}

					callback();

				}, err => {
					console.log( err );
					callback();
				});

	}, err => {
			// if anything produces an error, err will equal that error
			if( err ) {
				// One of the iterations produced an error.  All processing will now stop.
				console.log('an error occurred saving the outside contact\'s volunteer status');
				next();
			} else {
				console.log('outside contact volunteer status saved successfully');
				next();
			}
	});
});

// Set up relationship values to show up at the bottom of the model if any exist
OutsideContact.relationship({ ref: 'Mailing List', refPath: 'outsideContactSubscribers', path: 'mailing-lists', label: 'mailing lists' });

// Define default columns in the admin interface and register the model
OutsideContact.defaultColumns = 'name, type, organization';
OutsideContact.register();
