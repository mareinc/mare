const keystone  = require( 'keystone' ),
      Types     = keystone.Field.Types;

// Create model
const MailChimpList = new keystone.List('MailChimpList', {
    label:      'MailChimp List',
	autokey:    { path: 'key', from: 'name', unique: true }
});

// Create fields
MailChimpList.add({
    name:      { type: Types.Text, required: true, initial: true },
    }, 'Display on Website', {
    displayText: { type: Types.Text, label: 'label on website', initial: true },
    displayOnWebsite: { type: Types.Boolean, initial: true },
    showOnSiteVisitorRegistrationPage: { type: Types.Boolean, label: 'show on the site visitor registration page', initial: true },
    showOnSocialWorkerRegistrationPage: { type: Types.Boolean, label: 'show on the social worker registration page', initial: true },
    showOnFamilyRegistrationPage: { type: Types.Boolean, label: 'show on the family registration page', initial: true }
    }, 'MailChimp Configuration', {
    mailChimpId:    { type: Types.Text, label: 'MailChimp List ID', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
MailChimpList.defaultColumns = 'name, mailChimpId';
MailChimpList.register();
