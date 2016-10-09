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
	map: { name: 'name.full' },
	defaultSort: 'name.full'
});

// Create fields
OutsideContact.add( 'General Information', {

	type: { type: Types.Relationship, label: 'type of contact', ref: 'Outside Contact Group', many: true, required: true, initial: true },

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	organization: { type: Types.Text, label: 'organization', initial: true }

}, 'Contact Information', {

	// email: { type: Types.Email, label: 'email address', unique: true, required: true, initial: true },
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

}, { heading: 'Relationship Maps', hidden: true }, {

	isVolunteer: { type: Types.Boolean, hidden: true, noedit: true }

});

// Pre Save
OutsideContact.schema.pre('save', function(next) {
	'use strict';

	var model			= this,
		contactGroups	= this.type;

	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = this.name.first + ' ' + this.name.last;
	// Reset the isVolunteer flag to allow a fresh check every save
	this.isVolunteer = false;

	// Loop through each of the outside contact groups the user should be added to and mark the outside contact as a volunteer
	// if they are part of the 'volunteers' outside contact group
	async.each(contactGroups, function(listID, callback) {

		OutsideContactGroup.model.findById(listID)
				.exec()
				.then(function(result) {
					// Events have outside contacts who are volunteers listed, we need to capture a reference to which outside contacts are volunteers
					if(result.name === 'volunteers') {
						model.isVolunteer = true;
					}

					callback();

				}, function(err) {
					console.log(err);
					callback();
				});

	}, function(err){
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

// Post Save
OutsideContact.schema.post('save', function() {
	'use strict';

	var model			= this,
		contactGroups	= this.type;

	// Loop through each of the outside contact groups the user should be added to and add them.  Async allows all assignments
	// to happen in parallel before handling the result.
	async.each(contactGroups, function(listID, callback) {
		console.log('listID 2:', listID);
		OutsideContactGroup.model.findById(listID)
				.exec()
				.then(function(result) {
					// Use the model _id to determine if they are already part of the outside contact group
					var inList = result.outsideContacts.indexOf(model._id) !== -1;
					// Add the model to the list only if they aren't already included
					if( !inList ) {
						result.outsideContacts.push(model._id);
						result.save(function(err) {
							console.log('outside contact saved to ' +  result.name + ' group');
							callback();
						}, function(err) {
							console.log(err);
							callback();
						});
					} else {
						callback();
					}

				}, function(err) {
					console.log(err);
					callback();
				});

	}, function(err){
			// if anything produces an error, err will equal that error
			if( err ) {
				// One of the iterations produced an error.  All processing will now stop.
				console.log('an error occurred saving the outside contact to one or more outside contact groups');
			} else {
				console.log('outside contact saved to all outside contact groups successfully');
			}
	});
});

// Set up relationship values to show up at the bottom of the model if any exist
OutsideContact.relationship({ ref: 'Outside Contact Group', refPath: 'outsideContacts', path: 'outside-contact-groups', label: 'outside contact groups' });
OutsideContact.relationship({ ref: 'Mailing List', refPath: 'outsideContactSubscribers', path: 'mailing-lists', label: 'mailing lists' });

// Define default columns in the admin interface and register the model
OutsideContact.defaultColumns = 'name.full, type, organization';
OutsideContact.register();
