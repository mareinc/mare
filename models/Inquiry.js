var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Inquiry = new keystone.List('Inquiry', {
	track: true,
	defaultSort: 'takenOn'
});

// Create fields
Inquiry.add('General Information', {

	takenBy: { type: Types.Relationship, label: 'taken by', ref: 'User', required: true, initial: true },
	takenOn: { type: Types.Text, label: 'taken on', note: 'mm/dd/yyyy', required: true, initial: true },
	inquiryType: { type: Types.Relationship, label: 'inquiry type', ref: 'Inquiry Type', required: true, index: true, initial: true },
	inquiryMethod: { type: Types.Relationship, label: 'inquiry method', ref: 'Inquiry Method', required: true, index: true, initial: true },

}, 'Inquiry Details', {

	source: { type: Types.Relationship, label: 'source', ref: 'Source', required: true, initial: true },
	child: { type: Types.Relationship, label: 'child', ref: 'Child', required: true, initial: true },
	prospectiveParentOrFamily: { type: Types.Relationship, label: 'familiy', ref: 'Prospective Parent or Family', required: true, initial: true },
	previousSocialWorker: { type: Types.Relationship, ref: 'Social Worker', noedit: true, hidden: true },
	socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', required: true, initial: true },
	sendConfirmation: { type: Types.Boolean, label: 'send confirmation', initial: true },
	comments: { type: Types.Textarea, label: 'comments', initial: true }

}, 'Agency', {

	initialAgencySaved: { type: Types.Boolean, default: 'false', noedit: true, hidden: true },
	agency: { type: Types.Relationship, label: 'agency at time of inquiry', ref: 'Agency', noedit: true }

});

// Pre Save
Inquiry.schema.pre('save', function(next) {
	'use strict';

	// Fetch the previously saved and currently set social worker values as strings because a reference fields === and == both don't recognize a match
	// If a bad value was saved, checking for existence of the field prevents a system crash
	var previousSocialWorker = this.previousSocialWorker ? this.previousSocialWorker.toString() : '',
		socialWorker 		 = this.socialWorker ? this.socialWorker.toString() : '';

	// Log an error if the Social Worker field isn't set, meaning that a bad relationship exists
	if(socialWorker === '') {
		console.error('Inquiry save attempt failed due to bad social worker relationship.');
		console.log(this);
	}

	// If we're saving for the first time or the social worker field has changed, recalculate the agency
	if(this.initialAgencySaved === false || previousSocialWorker !== socialWorker) {
		// In the promise based handler of the find operation below, context for the model is lost
		var self = this;

		// Fetch the agency the social worker is associated with at the time of the inquiry and save it to the agency field
		keystone.list('Social Worker').model.find()
				.where('_id', this.socialWorker)
				.exec()
				.then(function(socialWorkers) {

					socialWorker = socialWorkers[0];				// Get the target social worker
					self.agency  = socialWorker.agency;				// Set the agency field based on the selected social worker
					self.previousSocialWorker = self.socialWorker;	// Set the previous social worker field for tracking purposes on next save
					self.initialAgencySaved = true;					// Set the tracking value on the model to note that an agency value currently exists

					next();

				}, function(err) {
					console.log(err);
				});
	} else {
		// If the social worker value hasn't changed and it's not an initial save, call next() to allow the model to save
		next();
	}
});

// Define default columns in the admin interface and register the model
Inquiry.defaultColumns = 'takenOn, takenBy, child, prospectiveParentOrFamily, socialWorker, source';
Inquiry.register();