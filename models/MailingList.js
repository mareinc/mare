var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var MailingList = new keystone.List('Mailing List', {
	autokey: { path: 'key', from: 'mailingList', unique: true },
	map: { name: 'mailingList' }
});

// Create fields
MailingList.add( 'Subscribers', {
	mailingList: { type: Types.Text, label: 'mailing list', required: true, initial: true },
	adminSubscribers: { type: Types.Relationship, label: 'admin', ref: 'Admin', filters: { isActive: true }, many: true, initial: true },
	siteVisitorSubscribers: { type: Types.Relationship, label: 'site visitors', ref: 'Site Visitor', filters: { isActive: true }, many: true, initial: true },
	socialWorkerSubscribers: { type: Types.Relationship, label: 'social workers', ref: 'Social Worker', filters: { isActive: true }, many: true, initial: true },
	familySubscribers: { type: Types.Relationship, label: 'families', ref: 'Family', filters: { isActive: true }, many: true, initial: true },
	contactGroupSubscribers: { type: Types.Relationship, label: 'contact groups', ref: 'Contact Group', many: true, initial: true },
	outsideContactSubscribers: { type: Types.Relationship, label: 'outside contacts', ref: 'Outside Contact', many: true, initial: true },
}, 'Display on Registration Pages', {
	displayText: { type: Types.Text, label: 'label on registration pages', initial: true },
	showOnSiteVisitorRegistrationPage: { type: Types.Boolean, label: 'show on the site visitor registration page', initial: true },
	showOnSocialWorkerRegistrationPage: { type: Types.Boolean, label: 'show on the social worker registration page', initial: true },
	showOnFamilyRegistrationPage: { type: Types.Boolean, label: 'show on the family registration page', initial: true }

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// Define default columns in the admin interface and register the model
MailingList.defaultColumns = 'mailingList';
MailingList.register();
