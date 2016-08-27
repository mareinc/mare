var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var MailingList = new keystone.List('Mailing List', {
	autokey: { path: 'key', from: 'mailingList', unique: true },
	map: { name: 'mailingList' }
});

// Create fields
MailingList.add({
	mailingList: { type: Types.Text, label: 'mailing list', required: true, initial: true },
	adminSubscribers: { type: Types.Relationship, label: 'admin', ref: 'Admin', many: true, initial: true },
	siteVisitorSubscribers: { type: Types.Relationship, label: 'site visitors', ref: 'Site Visitor', many: true, initial: true },
	socialWorkerSubscribers: { type: Types.Relationship, label: 'social workers', ref: 'Social Worker', many: true, initial: true },
	familySubscribers: { type: Types.Relationship, label: 'families', ref: 'Family', many: true, initial: true },
	outsideContactGroupSubscribers: { type: Types.Relationship, label: 'outside contact groups', ref: 'Outside Contact Group', many: true, initial: true },
	outsideContactSubscribers: { type: Types.Relationship, label: 'outside contacts', ref: 'Outside Contact', many: true, initial: true }
});

// Define default columns in the admin interface and register the model
MailingList.defaultColumns = 'mailingList';
MailingList.register();
