var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Inquiry = new keystone.List('Inquiry', {
	track: true,
	defaultSort: 'takenBy'
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
	socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', required: true, initial: true },
	sendConfirmation: { type: Types.Boolean, label: 'send confirmation', initial: true },
	comments: { type: Types.Textarea, label: 'comments', initial: true }
});

// Define default columns in the admin interface and register the model
Inquiry.defaultColumns = 'takenOn, takenBy, child, prospectiveParentOrFamily, socialWorker, source';
Inquiry.register();