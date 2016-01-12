var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var MailingList = new keystone.List('Mailing List', {
	autokey: { path: 'key', from: 'mailingList', unique: true },
	map: { name: 'mailingList' }
});

// Create fields
MailingList.add({
	mailingList: { type: Types.Text, label: 'mailing list', required: true, index: true, initial: true }
});

MailingList.relationship({ path: 'mailing-lists', ref: 'Prospective Parent or Family', refPath: 'prospectiveParentOrFamily' });

// Define default columns in the admin interface and register the model
MailingList.defaultColumns = 'mailingList';
MailingList.register();