var keystone	= require('keystone'),
	Types		= keystone.Field.Types,
	async		= require('async'),
	MailingList	= keystone.list('Mailing List');

// Create model
var OutsideContact = new keystone.List('Outside Contact', {
	autokey: { path: 'key', from: 'slug', unique: true },
	map: { name: 'name.full' },
	defaultSort: 'name.full'
});

// Create fields
OutsideContact.add( 'General Information', {

	type: { type: Types.Relationship, label: 'type of contact', ref: 'Mailing List', many: true, required: true, initial: true },

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	organization: { type: Types.Text, label: 'organization', initial: true },

}, 'Contact Information', {

	email: { type: Types.Email, label: 'email address', unique: true, required: true, initial: true },

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
		mailingLists	= this.type;

	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = this.name.first + ' ' + this.name.last;
	// Reset the isVolunteer flag to allow a fresh check every save
	this.isVolunteer = false;

	// Loop through each of the mailing lists the user should be added to and add them.  Async allows all assignments
	// to happen in parallel before handling the result.
	async.each(mailingLists, function(listID, callback) {
		MailingList.model.findById(listID)
				.exec()
				.then(function(result) {
					// Events have outside contacts who are volunteers listed, we need to capture a reference to which outside contacts are volunteers
					if(result.mailingList === 'volunteers') {
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
				console.log('an error occurred saving the outside contact to one or more mailing lists');
				next();
			} else {
				console.log('outside contact saved to all email lists successfully');
				next();
			}
	});
});

// Post Save
OutsideContact.schema.post('save', function() {
	'use strict';

	var model			= this,
		mailingLists	= this.type;

	// Loop through each of the mailing lists the user should be added to and add them.  Async allows all assignments
	// to happen in parallel before handling the result.
	async.each(mailingLists, function(listID, callback) {
		MailingList.model.findById(listID)
				.exec()
				.then(function(result) {
					// Use the model _id to determine if they are already part of the mailing list
					var inList = result.outsideContactAttendees.indexOf(model._id) !== -1;
					// Add the model to the list only if they aren't already included
					if( !inList ) {
						result.outsideContactAttendees.push(model._id);
						result.save(function(err) {
							console.log('outside contact saved to ' +  result.mailingList + ' list');
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
				console.log('an error occurred saving the outside contact to one or more mailing lists');
			} else {
				console.log('outside contact saved to all email lists successfully');
			}
	});
});

// Set up relationship values to show up at the bottom of the model if any exist
OutsideContact.relationship({ ref: 'Mailing List', refPath: 'outsideContactAttendees', path: 'mailing-lists', label: 'mailing lists' });

// Define default columns in the admin interface and register the model
OutsideContact.defaultColumns = 'type, name.full, organization';
OutsideContact.register();